const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../config/supabase'); 
const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SCHEMA_DDL = `
    CREATE TABLE "UsersProfiles" ("ID" uuid, "Name" varchar, "Email" varchar, "Rol" varchar, "State" varchar, "AvatarUrl" varchar, "BirthDate" date, "CreatedAt" timestamp);
    CREATE TABLE "Admin" ("ID" uuid, "Phone" varchar);
    CREATE TABLE "Reviewer" ("ID" uuid, "Phone" varchar, "Career" varchar, "AsignedTutors" int, "ValidationsCompleted" int, "Notes" text, "DateJoined" text);
    CREATE TABLE "Tutors" ("ID" uuid, "Phone" varchar, "DateJoined" date, "TotalHours" int, "Hobbies" text, "Language" varchar, "Career" varchar, "Notes" text);
    CREATE TABLE "Students" ("ID" uuid, "EnrollmentNum" varchar, "Phone" varchar, "CurrentLevel" varchar, "DateJoined" date, "Notes" text, "Photo" varchar, "Language" varchar);
    
    CREATE TABLE "Courses" ("CourseID" int, "Name" varchar, "Language" varchar, "StartDate" timestamp, "EndDate" timestamp, "Period" varchar, "Status" varchar, "TutorID" uuid, "Level" varchar, "GradingStatus" varchar, "AdminComments" text);
    CREATE TABLE "Announcements" ("AnnounceID" int, "CourseID" int, "Zoomlink" varchar, "Date" date);
    
    CREATE TABLE "Enrollments" ("EnrollmentID" int, "CourseID" int, "StudentID" uuid, "FinalGrade" real, "FinalTutorComments" text);
    CREATE TABLE "Enrollments_Reviewers" ("Enrollment_ReviewerID" int, "TutorID" uuid, "ReviewerID" uuid);
    
    CREATE TABLE "Session" ("SessionID" int, "CourseID" int, "TutorID" uuid, "ReviewerID" uuid, "Date" date, "Duration" float, "Topic" varchar, "Status" varchar, "EvidencePhoto" varchar, "Url" varchar, "TypeAssistence" varchar, "Description" text, "NextSession" text, "StartTime" time, "TutorComments" text, "ReviewerStatus" varchar, "ReviewerComments" text, "CreatedAt" timestamp);
    CREATE TABLE "SessionStudents" ("ID" int, "SessionID" int, "StudentID" uuid, "Attendance" varchar, "IncidentReport" text);
    
    CREATE TABLE "Assignments" ("AssignmentID" int, "CourseID" int, "StudentID" uuid, "TutorID" uuid, "Title" varchar, "StudentFile" varchar, "Status" varchar, "Feedback" text, "Deadline" timestamp, "Description" varchar, "HelpMaterialLink" varchar, "Grade" int, "HelpMaterialFile" varchar, "StudentUrl" varchar, "AllowResubmit" boolean);
    
    CREATE TABLE "Repository" ("MaterialID" int, "CourseID" int, "TutorID" uuid, "Topic" varchar, "FileUrl" varchar, "Rating" int, "Level" varchar, "Language" varchar);
    CREATE TABLE "MaterialRatings" ("ID" int, "MaterialID" int, "TutorID" uuid, "Score" int);
`;

// tablas validas del esquema
const TABLAS_VALIDAS = [
    "UsersProfiles", "Admin", "Reviewer", "Tutors", "Students", 
    "Courses", "Announcements", "Enrollments", "Enrollments_Reviewers", 
    "Session", "SessionStudents", "Assignments", "Repository", "MaterialRatings"
];

// solo permite SELECT, bloquea cualquier keyword destructivo con word boundary
const validateSelectOnly = (sql) => {
    const cleanSql = sql.trim().toUpperCase();
    if (!cleanSql.startsWith('SELECT')) return false;
    const forbidden = ['INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER', 'TRUNCATE', 'GRANT', 'REVOKE', 'EXECUTE', 'EXEC', 'CREATE'];
    const pattern = new RegExp(`\\b(${forbidden.join('|')})\\b`);
    return !pattern.test(cleanSql);
};

// normaliza la respuesta del llm antes de comparar tokens de control
const extractControlToken = (text) => {
    const normalized = text.trim().toUpperCase().replace(/[^A-Z]/g, '');
    if (normalized === 'IRRELEVANTE') return 'IRRELEVANTE';
    if (normalized === 'MIXTA') return 'MIXTA';
    return null;
};

router.post('/chat-sql', async (req, res) => {
    const { question, forceExecute } = req.body;

    if (!question || !question.trim()) {
        return res.status(400).json({ success: false, message: "La pregunta no puede estar vacía." });
    }

    try {
        const prompt = `
Eres un experto analista de bases de datos PostgreSQL para la plataforma FasTalk.
Tu ÚNICA tarea es traducir preguntas en español a consultas SQL válidas para PostgreSQL.
Responde ÚNICAMENTE con la consulta SQL pura. Sin explicaciones, sin comillas invertidas, sin markdown.

══════════════════════════════════════════
REGLA CRÍTICA DE CLASIFICACIÓN (evalúa esto PRIMERO, antes de generar SQL):
══════════════════════════════════════════
Determina si la pregunta está relacionada con la plataforma FasTalk (cursos, tutores,
estudiantes, sesiones, tareas, materiales, usuarios, inscripciones, revisores).

CASO 1 — Pregunta 100% fuera de contexto (clima, chistes, recetas, deportes, historia, etc.):
  → Responde EXACTAMENTE con la palabra: IRRELEVANTE

CASO 2 — Pregunta MIXTA: contiene una parte válida de FasTalk Y una parte irrelevante
  (ej: "¿Cuántos tutores hay y cómo hago un café?", "Lista los cursos y dime un chiste"):
  → Responde EXACTAMENTE con la palabra: MIXTA

CASO 3 — Pregunta totalmente relacionada con FasTalk:
  → Genera el SQL correspondiente.

══════════════════════════════════════════
REGLAS DE SINTAXIS:
══════════════════════════════════════════
- SIEMPRE usa comillas dobles para nombres de tablas y columnas. NUNCA uses nombres sin comillas.
- Correcto:   SELECT COUNT(*) FROM "Courses" WHERE "Status" = 'Active'
- Incorrecto: SELECT COUNT(*) FROM Courses WHERE Status = 'Active'

══════════════════════════════════════════
TABLAS DISPONIBLES — SOLO puedes referenciar estas, con exactamente estos nombres:
══════════════════════════════════════════
"UsersProfiles", "Admin", "Reviewer", "Tutors", "Students",
"Courses", "Announcements", "Enrollments", "Enrollments_Reviewers",
"Session", "SessionStudents", "Assignments", "Repository", "MaterialRatings"

Si la pregunta requiere datos que no existen en estas tablas → responde: IRRELEVANTE

══════════════════════════════════════════
REGLAS DE NEGOCIO (aplica por defecto salvo que el usuario diga explícitamente
"todos", "historial", "pasados", "inactivos" o "cancelados"):
══════════════════════════════════════════
1. Al consultar "Courses" → filtrar por "Status" = 'Active'
2. Al consultar personas en "UsersProfiles" → filtrar por "State" = 'Active'

══════════════════════════════════════════
EJEMPLOS (few-shot):
══════════════════════════════════════════
Pregunta: ¿Cuántos cursos activos hay?
SQL: SELECT COUNT(*) AS total_cursos FROM "Courses" WHERE "Status" = 'Active'

Pregunta: ¿Cuántos tutores enseñan inglés?
SQL: SELECT COUNT(*) AS total_tutores FROM "Tutors" WHERE "Language" = 'English'

Pregunta: Muestra los 5 tutores con más horas totales
SQL: SELECT "ID", "TotalHours" FROM "Tutors" ORDER BY "TotalHours" DESC LIMIT 5

Pregunta: ¿Cuántos estudiantes hay inscritos en cursos de nivel B1?
SQL: SELECT COUNT(DISTINCT "e"."StudentID") AS total FROM "Enrollments" e JOIN "Courses" c ON "e"."CourseID" = "c"."CourseID" WHERE "c"."Level" = 'B1' AND "c"."Status" = 'Active'

Pregunta: ¿Qué tiempo hace hoy?
SQL: IRRELEVANTE

Pregunta: ¿Cuántos tutores hay y cómo hago pasta?
SQL: MIXTA

══════════════════════════════════════════
Esquema completo:
══════════════════════════════════════════
${SCHEMA_DDL}

Pregunta: ${question}
        `.trim();

        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama-3.3-70b-versatile",
            temperature: 0,
        });

        let rawResponse = chatCompletion.choices[0]?.message?.content?.trim() || "";

        // limpiar markdown primero, luego revisar tokens
        let generatedSql = rawResponse
            .replace(/```sql/gi, '')
            .replace(/```/g, '')
            .trim();

        // ─── validacion 1: tokens de control
        const controlToken = extractControlToken(generatedSql);

        if (controlToken === 'IRRELEVANTE') {
            return res.status(400).json({ 
                success: false, 
                message: "La pregunta no está relacionada con los datos de FasTalk. Intenta preguntar sobre cursos, alumnos, tutores, sesiones o tareas." 
            });
        }

        if (controlToken === 'MIXTA') {
            return res.status(400).json({ 
                success: false, 
                message: "Tu pregunta mezcla temas de FasTalk con contenido fuera de contexto. Por favor, haz una pregunta a la vez sobre la plataforma." 
            });
        }

        // limpiar punto y coma final
        if (generatedSql.endsWith(';')) {
            generatedSql = generatedSql.slice(0, -1);
        }

        // ─── validacion 2: solo select
        if (!validateSelectOnly(generatedSql)) {
            return res.status(400).json({ 
                success: false, 
                message: "Operación bloqueada por seguridad. Solo se permiten consultas de lectura (SELECT)." 
            });
        }

        // ─── validacion 3: tablas reales
        const usaTablaReal = TABLAS_VALIDAS.some(tabla => generatedSql.includes(`"${tabla}"`));
        if (!usaTablaReal) {
            return res.status(400).json({ 
                success: false, 
                message: "La IA generó una consulta que no corresponde al esquema de FasTalk (posibles tablas inventadas). Intenta reformular tu pregunta." 
            });
        }

        // ─── explain: estimacion de costo
        const { data: explainData, error: explainError } = await supabaseAdmin.rpc('explain_sql', { 
            query: generatedSql 
        });

        if (explainError) {
            // postgres falla si la ia invento una columna o tabla
            if (explainError.message.includes("does not exist")) {
                return res.status(400).json({ 
                    success: false, 
                    message: "La IA referenció un campo o tabla que no existe en el esquema. Intenta ser más específico en tu pregunta." 
                });
            }
            throw explainError;
        }

        let estimatedRows = 0;
        try {
            estimatedRows = explainData[0].Plan['Plan Rows'];
        } catch (e) {
            console.log("No se pudo leer el plan EXPLAIN detallado.");
        }

        if (estimatedRows > 100000 && !forceExecute) {
            return res.status(200).json({ 
                success: true, 
                requiresConfirmation: true, 
                estimatedRows, 
                sql: generatedSql,
                message: `Advertencia: la consulta podría escanear ~${estimatedRows.toLocaleString()} filas. ¿Deseas continuar de todas formas?` 
            });
        }

        // ─── ejecucion
        const { data: queryResults, error: queryError } = await supabaseAdmin.rpc('execute_dynamic_sql', { 
            query: generatedSql 
        });

        if (queryError) throw queryError;

        const filasDevueltas = queryResults ? queryResults.length : 0;

        // ─── auditoria
        const auditEntry = {
            timestamp: new Date().toISOString(),
            question,
            generated_sql: generatedSql,
            rows_returned: filasDevueltas
        };
        console.log('\n========== logsito de auditoria ==========');
        console.log(JSON.stringify(auditEntry, null, 2));

        try {
            await supabaseAdmin.from('QueryAudit').insert([{
                Question: question,
                GeneratedSQL: generatedSql,
                RowsReturned: filasDevueltas
            }]);
        } catch (auditError) {
            console.warn('[AUDIT LOG] no se pudo insertar en supabase:', auditError.message);
        }

        res.status(200).json({ success: true, sql: generatedSql, data: queryResults });

    } catch (error) {
        console.error("ERROR EN IA:", error);
        res.status(500).json({ success: false, message: "Error interno del servidor: " + error.message });
    }
});

module.exports = router;
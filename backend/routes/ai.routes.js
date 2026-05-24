const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../config/supabase'); 
const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Esquema actualizado con los datos reales conforme a la base de datos
const SCHEMA_DDL = `
    CREATE TABLE "UsersProfiles" (
        "ID" INT, 
        "Name" VARCHAR(100), 
        "Email" VARCHAR(100), 
        "Rol" VARCHAR(20), 
        "AvatarUrl" VARCHAR(255), 
        "CreatedAt" TIMESTAMPTZ, 
        "BirthDate" DATE
    );

    CREATE TABLE "Students" (
        "ID" INT, 
        "EnrollmentNum" VARCHAR(50), 
        "Phone" VARCHAR(10), 
        "CurrentLevel" VARCHAR(20), 
        "DateJoined" DATE, 
        "Notes" TEXT, 
        "Language" VARCHAR(20)
    );

    CREATE TABLE "Tutors" (
        "ID" INT, 
        "Phone" VARCHAR(10), 
        "DateJoined" DATE, 
        "TotalHours" INT, 
        "Language" VARCHAR(20), 
        "Hobbies" VARCHAR(500), 
        "Career" VARCHAR(6), 
        "Notes" TEXT
    );

    CREATE TABLE "Reviewer" (
        "ID" INT, 
        "Phone" VARCHAR(10), 
        "Career" VARCHAR(6), 
        "ValidationsCompleted" INT, 
        "Notes" TEXT, 
        "DateJoined" DATE
    );

    CREATE TABLE "Admin" (
        "ID" VARCHAR(100), 
        "Phone" VARCHAR(10)
    );

    CREATE TABLE "Courses" (
        "CourseID" INT, 
        "Name" VARCHAR(255), 
        "Language" VARCHAR(20), 
        "StartDate" TIMESTAMP, 
        "EndDate" TIMESTAMP, 
        "Period" VARCHAR(255), 
        "Status" VARCHAR(20), 
        "TutorID" INT, 
        "Level" VARCHAR(20), 
        "GradingStatus" VARCHAR(50)
    );

    CREATE TABLE "Enrollments" (
        "EnrollmentID" INT, 
        "CourseID" INT, 
        "StudentID" INT, 
        "TutorID" INT
    );

    CREATE TABLE "Announcements" (
        "AnnounceID" INT, 
        "CourseID" INT, 
        "Zoomlink" VARCHAR(255), 
        "Date" DATE
    );

    CREATE TABLE "Enrollments_Reviewers" (
        "Enrollment_ReviewerID" INT, 
        "TutorID" INT, 
        "ReviewerID" INT
    );

    CREATE TABLE "Session" (
        "SessionID" INT, 
        "CourseID" INT, 
        "TutorID" INT, 
        "ReviewerID" INT, 
        "Date" DATE, 
        "Duration" FLOAT, 
        "Topic" VARCHAR(255), 
        "ReviewerStatus" VARCHAR(50), 
        "EvidencePhoto" VARCHAR(255), 
        "Url" VARCHAR(255), 
        "TypeAssistence" VARCHAR(50), 
        "Description" VARCHAR(1000), 
        "NextSession" VARCHAR(1000), 
        "StartTime" TIME, 
        "TutorComments" TEXT, 
        "ReviewerComments" TEXT
    );

    CREATE TABLE "SessionStudents" (
        "SessionID" INT, 
        "StudentID" INT, 
        "Attendance" VARCHAR(50), 
        "IncidentReport" TEXT
    );

    CREATE TABLE "Assignments" (
        "AssignmentID" INT, 
        "CourseID" INT, 
        "StudentID" INT, 
        "TutorID" INT, 
        "Title" VARCHAR(150), 
        "StudentFile" VARCHAR(255), 
        "Status" VARCHAR(50), 
        "Feedback" TEXT, 
        "Deadline" TIMESTAMP, 
        "Description" VARCHAR(1000), 
        "HelpMaterialLink" VARCHAR(255), 
        "Grade" INT, 
        "HelpMaterialFile" VARCHAR(255), 
        "AllowResubmit" BOOLEAN, 
        "StudentUrl" VARCHAR(255)
    );

    CREATE TABLE "Repository" (
        "MaterialID" INT, 
        "CourseID" INT, 
        "TutorID" INT, 
        "Topic" VARCHAR(200), 
        "FileUrl" VARCHAR(255), 
        "Rating" INT, 
        "Level" VARCHAR(20), 
        "Language" VARCHAR(50)
    );

    CREATE TABLE "MaterialRatings" (
        "RatingID" INT, 
        "MaterialID" INT, 
        "TutorID" INT, 
        "Score" INT
    );
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
    Responde ÚNICAMENTE con la consulta SQL pura. Sin explicaciones, sin comillas invertidas, sin markdown[cite: 35].

    ══════════════════════════════════════════
    REGLA CRÍTICA DE CLASIFICACIÓN (evalúa esto PRIMERO, antes de generar SQL):
    ══════════════════════════════════════════
    Determina si la pregunta está relacionada con la plataforma FasTalk (cursos, tutores, estudiantes, sesiones, tareas, materiales, usuarios, inscripciones, revisores).

    CASO 1 — Pregunta 100% fuera de contexto (clima, chistes, recetas, deportes, historia, etc.):
    → Responde EXACTAMENTE con la palabra: IRRELEVANTE

    CASO 2 — Pregunta MIXTA: contiene una parte válida de FasTalk Y una parte irrelevante 
    (ej: "¿Cuántos tutores hay y cómo hago un café?", "Lista los cursos y dime un chiste"):
    → Responde EXACTAMENTE con la palabra: MIXTA

    CASO 3 — Pregunta totalmente relacionada con FasTalk:
    → Genera el SQL correspondiente.

    ══════════════════════════════════════════
    REGLAS DE SINTAXIS OBLIGATORIAS:
    ══════════════════════════════════════════
    - SIEMPRE usa comillas dobles para nombres de tablas y columnas. NUNCA uses nombres sin comillas.
    * Correcto: SELECT "Name" FROM "UsersProfiles";
    * Incorrecto: SELECT Name FROM UsersProfiles;

    ══════════════════════════════════════════
    TABLAS DISPONIBLES — SOLO puedes referenciar estas, con exactamente estos nombres:
    ══════════════════════════════════════════
    "UsersProfiles", "Admin", "Reviewer", "Tutors", "Students", 
    "Courses", "Announcements", "Enrollments", "Enrollments_Reviewers", 
    "Session", "SessionStudents", "Assignments", "Repository", "MaterialRatings"

    Si la pregunta requiere datos que no existen en estas tablas → responde: IRRELEVANTE

    ══════════════════════════════════════════
    REGLAS DE NEGOCIO (aplica por defecto salvo que el usuario diga "todos" o "historial"):
    ══════════════════════════════════════════
    1. Al consultar "Courses" → filtrar por "Status" = 'Active'. ¡EL ENUM ES ESTRICTO! El valor es EXACTAMENTE 'Active'. NUNCA uses 'activo' o 'active'.
    2. Al consultar personas en "UsersProfiles" → filtrar por "State" = 'Active'.
    3. Para el campo "Language" (Idioma) ¡EL ENUM ES ESTRICTO!. Los ÚNICOS valores válidos son 'Inglés' y 'Francés' (respetando las mayúsculas y los acentos). NUNCA uses 'English', 'French', 'ingles' o 'frances'.

    ══════════════════════════════════════════
    MAPA DE UNIONES PARA JOINS (Basado en IDs de tipo INT):
    ══════════════════════════════════════════
    - Para obtener el Nombre o Email de un Alumno: "UsersProfiles"."ID" = "Students"."ID"
    - Para obtener el Nombre o Email de un Tutor: "UsersProfiles"."ID" = "Tutors"."ID"
    - Alumnos inscritos en un curso: "Enrollments"."CourseID" = "Courses"."CourseID" AND "Enrollments"."StudentID" = "Students"."ID"

    ══════════════════════════════════════════
    EJEMPLOS (few-shot):
    ══════════════════════════════════════════
    Pregunta: ¿Cuántos tutores enseñan inglés?
    SQL: SELECT COUNT(*) AS total_tutores FROM "Tutors" WHERE "Language" = 'Inglés';

    Pregunta: ¿Qué tiempo hace hoy?
    SQL: IRRELEVANTE

    Pregunta: ¿Cuántos tutores hay y cómo hago pasta?
    SQL: MIXTA

    Pregunta: ¿Cuántos cursos activos hay en total?
    SQL: SELECT COUNT(*) FROM "Courses" WHERE "Status" = 'Active';

    Pregunta: Dame la lista de estudiantes en el curso a2 (muestra nombre y correo)
    SQL: SELECT u."Name", u."Email" FROM "Enrollments" e JOIN "Students" s ON e."StudentID" = s."ID" JOIN "UsersProfiles" u ON s."ID" = u."ID" JOIN "Courses" c ON e."CourseID" = c."CourseID" WHERE c."Name" = 'a2';

    ══════════════════════════════════════════
    Esquema completo:
    ══════════════════════════════════════════
    ${SCHEMA_DDL}

    Pregunta: ${question}
    SQL:
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
        console.log('\nlogsito de auditoria ');
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
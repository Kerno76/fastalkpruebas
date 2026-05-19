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

const validateSelectOnly = (sql) => {
    const cleanSql = sql.trim().toUpperCase();
    if (!cleanSql.startsWith('SELECT')) return false;
    const forbidden = ['INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER', 'TRUNCATE', 'GRANT', 'REVOKE'];
    for (let word of forbidden) {
        if (cleanSql.includes(` ${word} `) || cleanSql.includes(`;${word}`)) return false;
    }
    return true;
};

router.post('/chat-sql', async (req, res) => {
    const { question, forceExecute } = req.body;

    try {
const prompt = `
            Eres un experto analista de bases de datos PostgreSQL. 
            Tu única tarea es traducir la pregunta a una consulta SQL válida.
            Responde ÚNICAMENTE con la consulta SQL pura. Nada de explicaciones, nada de comillas invertidas (\`\`\`), nada de markdown.
            
            REGLAS DE SINTAXIS: 
            - Los nombres de tablas y columnas tienen mayúsculas. DEBES envolver SIEMPRE los nombres de las tablas y columnas entre comillas dobles (" ").
            - Ejemplo correcto: SELECT * FROM "Courses";
            
            REGLAS DE NEGOCIO (MUY IMPORTANTE):
            A menos que el usuario especifique explícitamente lo contrario:
            1. Siempre que consultes la tabla "Courses", filtra por "Status" = 'Active'.
            2. BÚSQUEDAS FLEXIBLES: Si el usuario busca un nombre o texto, NUNCA uses el signo de igual (=). Usa SIEMPRE el operador ILIKE con comodines (%). Ejemplo: WHERE "Name" ILIKE '%Juan Emmanuel%'
            3. CUIDADO CON LAS COLUMNAS: Si necesitas verificar que un usuario esté activo, recuerda que la columna "State" SOLO existe en la tabla "UsersProfiles".
            
            -- NUEVA REGLA: DATOS LEGIBLES PARA HUMANOS (NUNCA IDs) --
            4. PROHIBIDO DEVOLVER IDs: En tu cláusula SELECT, NUNCA devuelvas claves primarias, claves foráneas, UUIDs o columnas que terminen en "ID" (ej. "CourseID", "TutorID", "StudentID"). El usuario humano no entiende esos códigos. 
            SIEMPRE debes hacer los JOINs necesarios para devolver el texto descriptivo:
            - En lugar de "StudentID", "TutorID" o "ReviewerID", devuelve el "Name" haciendo JOIN con "UsersProfiles".
            - En lugar de "CourseID", devuelve el "Name" haciendo JOIN con "Courses".
            - Devuelve métricas útiles directamente (como "TotalHours", "Grade", "Duration").
            
            Esquema:
            ${SCHEMA_DDL}

            Pregunta: ${question}
        `;

        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: "system", content: prompt }],
            model: "llama-3.3-70b-versatile",
            temperature: 0, 
        });

        let generatedSql = chatCompletion.choices[0]?.message?.content?.trim() || "";
        
        generatedSql = generatedSql.replace(/```sql/gi, '').replace(/```/g, '').trim();
        if (generatedSql.endsWith(';')) {
            generatedSql = generatedSql.slice(0, -1);
        }

        if (!validateSelectOnly(generatedSql)) {
            return res.status(400).json({ success: false, message: "Operación bloqueada por seguridad. Solo se permiten SELECTs." });
        }

        const { data: explainData, error: explainError } = await supabaseAdmin.rpc('explain_sql', { 
            query: generatedSql 
        });

        if (explainError) throw explainError;

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
                message: `Advertencia: ~${estimatedRows} filas estimadas. ¿Deseas continuar?` 
            });
        }

        const { data: queryResults, error: queryError } = await supabaseAdmin.rpc('execute_dynamic_sql', { 
            query: generatedSql 
        });

        if (queryError) throw queryError;

        const filasDevueltas = queryResults ? queryResults.length : 0;

        await supabaseAdmin.from('QueryAudit').insert([{
            Question: question,
            GeneratedSQL: generatedSql,
            RowsReturned: filasDevueltas
        }]);

        res.status(200).json({ success: true, sql: generatedSql, data: queryResults });

    } catch (error) {
        console.error("ERROR EN IA:", error);
        res.status(500).json({ success: false, message: "Error en la consulta: " + error.message });
    }
});

module.exports = router;
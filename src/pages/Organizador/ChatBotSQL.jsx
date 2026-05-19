import { useState } from 'react';
import { TextField, Button, Paper, Typography, Table, TableHead, TableRow, TableCell, TableBody, CircularProgress, Box, Chip, InputAdornment, IconButton, TableContainer } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import StorageIcon from '@mui/icons-material/Storage';
import CodeIcon from '@mui/icons-material/Code';
import LightbulbCircleIcon from '@mui/icons-material/LightbulbCircle';
import toast from 'react-hot-toast';
import '../../styles/App.css';

export default function ChatBotSQL() {
    const [query, setQuery] = useState('');
    const [response, setResponse] = useState(null);
    const [loading, setLoading] = useState(false);
    const [pendingSql, setPendingSql] = useState(null);

    const sugerencias = [
        "¿Cuántos cursos hay en total?",
        "Muestra el nombre y rol de todos los usuarios",
        "¿Cuáles cursos son de nivel B1?",
        "Dame el promedio de las calificaciones finales"
    ];

    const handleSend = async (force = false, textToSearch = query) => {
        if (!textToSearch.trim()) return;
        setLoading(true);
        setResponse(null);
        setQuery(textToSearch); // Actualiza el input si se usó una sugerencia

        try {
            const res = await fetch("http://localhost:8000/api/ai/chat-sql", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ question: textToSearch, forceExecute: force })
            });
            const data = await res.json();

            if (data.requiresConfirmation) {
                setPendingSql(data.sql);
                toast(
                    (t) => (
                        <div>
                            <Typography variant="body2" style={{ fontWeight: 800 }}>{data.message}</Typography>
                            <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
                                <Button size="small" variant="contained" color="warning" onClick={() => { toast.dismiss(t.id); handleSend(true, textToSearch); }} style={{ textTransform: 'none', fontWeight: 600 }}>Continuar</Button>
                                <Button size="small" variant="outlined" onClick={() => toast.dismiss(t.id)} style={{ textTransform: 'none', fontWeight: 600 }}>Cancelar</Button>
                            </div>
                        </div>
                    ), { duration: Infinity }
                );
            } else if (data.success) {
                setResponse({ sql: data.sql, rows: data.data });
                setPendingSql(null);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error("Error al consultar a la IA");
        } finally {
            setLoading(false);
        }
    };

    const renderTable = (rows) => {
        if (!rows || rows.length === 0) return (
            <Box textAlign="center" py={4}>
                <StorageIcon style={{ fontSize: 40, color: '#cbd5e1', marginBottom: '10px' }} />
                <Typography style={{ color: '#64748b' }}>La consulta se ejecutó correctamente, pero no devolvió ningún resultado.</Typography>
            </Box>
        );
        
        const columns = Object.keys(rows[0]);

        return (
            <TableContainer component={Paper} elevation={0} style={{ border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                <Table size="small">
                    <TableHead style={{ backgroundColor: '#f8fafc' }}>
                        <TableRow>
                            {columns.map(col => (
                                <TableCell key={col} style={{ fontWeight: 800, color: '#475569', textTransform: 'uppercase', fontSize: '0.75rem' }}>
                                    {col}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {rows.map((row, idx) => (
                            <TableRow key={idx} sx={{ '&:last-child td, &:last-child th': { border: 0 }, '&:hover': { backgroundColor: '#f1f5f9' } }}>
                                {columns.map(col => (
                                    <TableCell key={col} style={{ color: '#334155' }}>
                                        {row[col] !== null ? row[col].toString() : <em>null</em>}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        );
    };

    return (
        <div className='mainContent'>
            <div className="header-container" style={{ marginBottom: '25px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <AutoAwesomeIcon style={{ color: '#0ea5e9', fontSize: '32px' }} />
                        <h2 className="dashboard-title" style={{ margin: 0 }}>Asistente Inteligente de FasTalk</h2>
                    </div>
                    <p className="--subtitle-main" style={{ color: '#64748b' }}>
                        Consulta la información operativa de la plataforma usando lenguaje natural. La inteligencia artificial traducirá tu petición a SQL y ejecutará la búsqueda de manera segura.
                    </p>
                </div>
            </div>

            <Paper elevation={0} style={{ padding: '25px', borderRadius: '16px', border: '1px solid #e2e8f0', backgroundColor: '#fff', marginBottom: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '30px' }}>
                    <TextField 
                        fullWidth 
                        variant="outlined"
                        placeholder="Ej. Muéstrame todos los tutores activos..." 
                        value={query} 
                        onChange={e => setQuery(e.target.value)} 
                        onKeyPress={e => e.key === 'Enter' && handleSend(false, query)}
                        InputProps={{
                            style: { borderRadius: '12px', backgroundColor: '#f8fafc', paddingRight: '5px' },
                            endAdornment: (
                                <InputAdornment position="end">
                                    <Button 
                                        variant="contained" 
                                        color="primary" 
                                        onClick={() => handleSend(false, query)} 
                                        disabled={loading || !query.trim()}
                                        style={{ borderRadius: '8px', minWidth: '45px', padding: '8px 15px', boxShadow: 'none' }}
                                    >
                                        {loading ? <CircularProgress size={20} color="inherit" /> : <SendIcon fontSize="small" />}
                                    </Button>
                                </InputAdornment>
                            )
                        }}
                    />
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <LightbulbCircleIcon style={{ color: '#eab308' }} />
                        <Typography variant="body2" style={{ color: '#64748b', fontWeight: 600 }}>Sugerencias:</Typography>
                        {sugerencias.map((sug, index) => (
                            <Chip 
                                key={index} 
                                label={sug} 
                                onClick={() => handleSend(false, sug)} 
                                variant="outlined"
                                clickable
                                style={{ color: '#0369a1', borderColor: '#bae6fd', backgroundColor: '#f0f9ff', fontWeight: 600 }}
                            />
                        ))}
                    </div>
                </div>

                {loading && !response && (
                    <Box textAlign="center" py={5} style={{ backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px dashed #e2e8f0' }}>
                        <AutoAwesomeIcon className="spin-animation" style={{ fontSize: 40, color: '#0ea5e9', opacity: 0.5, marginBottom: '15px' }} />
                        <Typography style={{ color: '#475569', fontWeight: 600 }}>Procesando consulta con la IA...</Typography>
                    </Box>
                )}

                {response && (
                    <div className="fade-in">
                        <Box sx={{ p: 2, bgcolor: '#1e293b', borderRadius: '12px', mb: 3, display: 'flex', alignItems: 'flex-start', gap: 1.5, overflowX: 'auto' }}>
                            <CodeIcon style={{ color: '#38bdf8', marginTop: '2px' }} />
                            <div>
                                <Typography variant="caption" style={{ color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Sentencia SQL Generada por IA (Groq)
                                </Typography>
                                <Typography style={{ color: '#f8fafc', fontFamily: 'monospace', fontSize: '0.95rem', marginTop: '4px', whiteSpace: 'pre-wrap' }}>
                                    {response.sql}
                                </Typography>
                            </div>
                        </Box>
                        
                        <div>
                            <Typography variant="h6" style={{ fontWeight: 800, color: '#1e293b', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <StorageIcon style={{ color: '#64748b' }} /> Resultados de la base de datos
                            </Typography>
                            {renderTable(response.rows)}
                        </div>
                    </div>
                )}
            </Paper>

            <style>{`
                .spin-animation { animation: spin 2s linear infinite; }
                @keyframes spin { 100% { transform: rotate(360deg); } }
                .fade-in { animation: fadeIn 0.5s ease-in-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
}
router.get('/notificaciones/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const { data, error } = await supabaseAdmin
            .from('Notifications')
            .select('*')
            .eq('ReceiverID', userId)
            .order('CreatedAt', { ascending: false })
            .limit(10);

        if (error) throw error;
        res.status(200).json({ success: true, notificaciones: data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.put('/notificaciones/leer/:notifId', async (req, res) => {
    const { notifId } = req.params;
    try {
        const { error } = await supabaseAdmin
            .from('Notifications')
            .update({ IsRead: true })
            .eq('NotificationID', notifId);

        if (error) throw error;
        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/estudiante/proxima-sesion/:studentId', async (req, res) => {
    const { studentId } = req.params;
    try {
        const { data: participaciones, error: partErr } = await supabaseAdmin
            .from('SessionStudents')
            .select('SessionID')
            .eq('StudentID', studentId);

        if (partErr) throw partErr;

        if (!participaciones || participaciones.length === 0) {
            return res.status(200).json({ success: true, proximaSesion: null });
        }

        const sessionIds = participaciones.map(p => p.SessionID);
        const hoy = new Date().toISOString().split('T')[0];

        const { data, error } = await supabaseAdmin
            .from('Session')
            .select('Date, StartTime, Topic, Url')
            .in('SessionID', sessionIds)
            .eq('Status', 'Scheduled')
            .gte('Date', hoy)
            .order('Date', { ascending: true })
            .order('StartTime', { ascending: true })
            .limit(1);

        if (error) throw error;
        
        res.status(200).json({ success: true, proximaSesion: data.length > 0 ? data[0] : null });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
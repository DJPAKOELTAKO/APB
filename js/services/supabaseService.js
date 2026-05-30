// Supabase Database & Auth Service Integration
// Connects directly to a real Supabase instance and replaces the mock database

class SupabaseService {
  constructor() {
    this.client = null;
    this.initClient();
  }

  // --- Initialize Supabase SDK ---
  initClient() {
    // 1. Lee credenciales desde window.APP_CONFIG (js/config.js)
    // 2. Fallback a localStorage para sobreescrituras manuales
    const configUrl  = (window.APP_CONFIG && window.APP_CONFIG.SUPABASE_URL)      || '';
    const configKey  = (window.APP_CONFIG && window.APP_CONFIG.SUPABASE_ANON_KEY) || '';
    const savedUrl   = localStorage.getItem('supabase_url')      || configUrl;
    const savedKey   = localStorage.getItem('supabase_anon_key') || configKey;

    this.supabaseUrl = savedUrl;
    this.supabaseKey = savedKey;

    if (this.supabaseUrl && this.supabaseKey) {
      try {
        // Exposes global supabase object from CDN script
        if (window.supabase) {
          this.client = window.supabase.createClient(this.supabaseUrl, this.supabaseKey);
          window.supabaseClientInstance = this.client;
          console.log('Supabase configurado correctamente.');
        } else {
          console.warn('SDK de Supabase no cargado en window.');
        }
      } catch (err) {
        console.error('Error al inicializar cliente de Supabase:', err);
        this.client = null;
      }
    } else {
      console.log('Esperando credenciales de Supabase...');
    }
  }

  isConfigured() {
    return this.client !== null;
  }

  saveCredentials(url, key) {
    localStorage.setItem('supabase_url', url.trim());
    localStorage.setItem('supabase_anon_key', key.trim());
    this.initClient();
    return this.isConfigured();
  }

  clearCredentials() {
    localStorage.removeItem('supabase_url');
    localStorage.removeItem('supabase_anon_key');
    this.client = null;
  }

  // --- Auth Methods (Real Supabase Auth) ---
  async login(email, password) {
    if (!this.isConfigured()) return { success: false, message: 'Supabase no está configurado.' };

    try {
      const emailClean = email.toLowerCase().trim();
      const { data: authData, error: authError } = await this.client.auth.signInWithPassword({
        email: emailClean,
        password: password
      });

      if (authError) throw authError;

      // Fetch corresponding profile details from database
      const { data: profile, error: profileError } = await this.client
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileError) {
        // Fallback: If profile doesn't exist yet, insert a default one
        const newProfile = {
          id: authData.user.id,
          name: emailClean.split('@')[0],
          phone: '',
          email: emailClean,
          role: 'client'
        };
        await this.client.from('profiles').insert(newProfile);
        return { success: true, user: { ...newProfile, token: authData.session.access_token } };
      }

      return {
        success: true,
        user: {
          id: profile.id,
          name: profile.name,
          phone: profile.phone || '',
          email: profile.email,
          role: profile.role || 'client',
          token: authData.session.access_token
        }
      };
    } catch (err) {
      console.error('Error de inicio de sesión:', err);
      return { success: false, message: err.message || 'Error de autenticación.' };
    }
  }

  async register(name, email, phone, password = 'password123') {
    if (!this.isConfigured()) return { success: false, message: 'Supabase no está configurado.' };

    try {
      const emailClean = email.toLowerCase().trim();
      // SignUp handles inserting profile details inside user metadata
      // The Supabase trigger 'on_auth_user_created' will read this metadata and write to the profiles table
      const { data: authData, error: authError } = await this.client.auth.signUp({
        email: emailClean,
        password: password,
        options: {
          data: {
            name: name.trim(),
            phone: phone.trim()
          }
        }
      });

      if (authError) throw authError;

      // Auto login immediately
      return this.login(emailClean, password);
    } catch (err) {
      console.error('Error al registrar usuario:', err);
      return { success: false, message: err.message || 'Error al crear la cuenta.' };
    }
  }

  async getCurrentUser() {
    if (!this.isConfigured()) return null;

    try {
      const { data: { session } } = await this.client.auth.getSession();
      if (!session) return null;

      const { data: profile, error } = await this.client
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error) throw error;

      return {
        id: profile.id,
        name: profile.name,
        phone: profile.phone || '',
        email: profile.email,
        role: profile.role || 'client',
        token: session.access_token
      };
    } catch (err) {
      console.error('Error al obtener usuario actual:', err);
      return null;
    }
  }

  async logout() {
    if (!this.isConfigured()) return;
    try {
      await this.client.auth.signOut();
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
    }
  }

  // --- Clients/Profiles Data ---
  async getClients() {
    if (!this.isConfigured()) return [];
    try {
      const { data, error } = await this.client
        .from('profiles')
        .select('*')
        .eq('role', 'client')
        .order('name');

      if (error) throw error;
      return data.map(c => ({
        id: c.id,
        name: c.name,
        phone: c.phone || '',
        email: c.email,
        lastVisit: c.last_visit || 'N/A'
      }));
    } catch (err) {
      console.error('Error al obtener clientes:', err);
      return [];
    }
  }

  async getClientById(id) {
    if (!this.isConfigured()) return null;
    try {
      const { data, error } = await this.client
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return {
        id: data.id,
        name: data.name,
        phone: data.phone || '',
        email: data.email,
        lastVisit: data.last_visit || 'N/A'
      };
    } catch (err) {
      console.error('Error al obtener cliente por ID:', err);
      return null;
    }
  }

  async updateClientProfile(id, name, phone, email) {
    if (!this.isConfigured()) return { success: false, message: 'Supabase no está configurado.' };
    try {
      const { data, error } = await this.client
        .from('profiles')
        .update({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return {
        success: true,
        client: {
          id: data.id,
          name: data.name,
          phone: data.phone || '',
          email: data.email,
          lastVisit: data.last_visit || 'N/A'
        }
      };
    } catch (err) {
      console.error('Error al actualizar perfil:', err);
      return { success: false, message: err.message || 'Error al actualizar.' };
    }
  }

  // --- Services and Barbers ---
  async getServices() {
    if (!this.isConfigured()) return [];
    try {
      const { data, error } = await this.client
        .from('barber_services')
        .select('*')
        .order('id');

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error al obtener servicios:', err);
      return [];
    }
  }

  async getBarbers() {
    if (!this.isConfigured()) return [];
    try {
      const { data, error } = await this.client
        .from('barbers')
        .select('*')
        .order('id');

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error al obtener barberos:', err);
      return [];
    }
  }

  // --- Appointments Management ---
  async getAppointments() {
    if (!this.isConfigured()) return [];
    try {
      const { data, error } = await this.client
        .from('appointments')
        .select('*, client:profiles(*), service:barber_services(*), barber:barbers(*)')
        .order('date', { ascending: true })
        .order('time', { ascending: true });

      if (error) throw error;
      return this.mapSupabaseAppointments(data);
    } catch (err) {
      console.error('Error al obtener citas:', err);
      return [];
    }
  }

  async getAppointmentsByClient(clientId) {
    if (!this.isConfigured()) return [];
    try {
      const { data, error } = await this.client
        .from('appointments')
        .select('*, client:profiles(*), service:barber_services(*), barber:barbers(*)')
        .eq('client_id', clientId)
        .order('date', { ascending: true })
        .order('time', { ascending: true });

      if (error) throw error;
      return this.mapSupabaseAppointments(data);
    } catch (err) {
      console.error('Error al obtener citas por cliente:', err);
      return [];
    }
  }

  mapSupabaseAppointments(appts) {
    return appts.map(a => ({
      id: a.id,
      clientId: a.client_id,
      clientName: a.client ? a.client.name : 'Cliente Desconocido',
      clientPhone: a.client ? a.client.phone : '',
      clientEmail: a.client ? a.client.email : '',
      barberId: a.barber_id,
      barberName: a.barber ? a.barber.name : 'Barbero Desconocido',
      serviceId: a.service_id,
      serviceName: a.service ? a.service.name : 'Servicio Desconocido',
      price: a.service ? parseFloat(a.service.price) : 0,
      date: a.date,
      time: a.time,
      status: a.status
    }));
  }

  async createAppointment(apptData) {
    if (!this.isConfigured()) return { success: false, message: 'Supabase no está configurado.' };
    try {
      const { data, error } = await this.client
        .from('appointments')
        .insert({
          client_id: apptData.clientId,
          barber_id: apptData.barberId,
          service_id: apptData.serviceId,
          date: apptData.date,
          time: apptData.time,
          status: 'scheduled'
        })
        .select('*, client:profiles(*), service:barber_services(*), barber:barbers(*)')
        .single();

      if (error) throw error;

      // Update client's last visit metadata
      await this.client
        .from('profiles')
        .update({ last_visit: apptData.date })
        .eq('id', apptData.clientId);

      const mapped = this.mapSupabaseAppointments([data])[0];
      return { success: true, appointment: mapped };
    } catch (err) {
      console.error('Error al agendar cita:', err);
      return { success: false, message: err.message || 'Error al agendar cita.' };
    }
  }

  async cancelAppointment(apptId) {
    if (!this.isConfigured()) return { success: false, message: 'Supabase no está configurado.' };
    try {
      // In a real database we delete the appointment or set status to cancelled
      // Let's delete it so it matches mock cancellation behavior exactly
      const { error } = await this.client
        .from('appointments')
        .delete()
        .eq('id', apptId);

      if (error) throw error;
      return { success: true };
    } catch (err) {
      console.error('Error al cancelar cita:', err);
      return { success: false, message: err.message || 'Error al cancelar.' };
    }
  }

  // --- WhatsApp Url Helper ---
  generateWhatsAppUrl(appointment) {
    const phoneClean = appointment.clientPhone.replace(/\D/g, '');
    const message = encodeURIComponent(
      `¡Hola ${appointment.clientName}! Te recordamos tu cita en *La Barbería Premium*.\n\n` +
      `📅 *Fecha:* ${appointment.date}\n` +
      `⏰ *Hora:* ${appointment.time}\n` +
      `💇 *Servicio:* ${appointment.serviceName}\n` +
      `💈 *Barbero:* ${appointment.barberName}\n\n` +
      `Por favor, confirma tu asistencia. ¡Te esperamos!`
    );
    return `https://wa.me/${phoneClean}?text=${message}`;
  }
}

// Global instantiation
const supabaseService = new SupabaseService();
window.mockService = supabaseService; // Keep mockService window name reference to minimize changes in other modules
window.supabaseService = supabaseService;

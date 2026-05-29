// Dashboard View Renderer
// Dynamically builds components and layout systems based on current user roles

class AdminDashboardView {
  constructor() {
    this.container = document.getElementById('dynamic-content');
    
    // Internal States for Booking Workflow
    this.selectedService = null;
    this.selectedBarber = null;
    this.selectedDate = '';
    this.selectedTime = '';
    
    // Internal State for Admin View
    this.selectedClientInDetail = null;
    this.appointmentsSearchQuery = '';

    // Bind WhatsApp Modal elements
    this.setupWhatsAppModal();
  }

  // --- Main Entrance: Render current section ---
  render(viewName) {
    const user = window.mockService.getCurrentUser();
    if (!user) return;

    this.container.innerHTML = '';
    
    if (viewName === 'dashboard') {
      if (user.role === 'admin') {
        this.renderAdminDashboard(user);
      } else {
        this.renderClientDashboard(user);
      }
    } else if (viewName === 'citas') {
      this.renderAppointmentsView(user);
    } else if (viewName === 'profile') {
      this.renderProfileView(user);
    }

    // Refresh icons inside dynamically rendered nodes
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  // ==========================================
  // --- CLIENT VIEW: DASHBOARD PRINCIPAL ---
  // ==========================================
  renderClientDashboard(user) {
    const clientAppointments = window.mockService.getAppointmentsByClient(user.id);
    const upcoming = clientAppointments.filter(a => a.status === 'scheduled');
    
    let nextAppointmentHtml = `
      <div class="bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-zinc-800/80 rounded-3xl p-6 flex flex-col justify-center items-center text-center h-full min-h-[180px] shadow-sm">
        <div class="p-3 bg-amber-500/10 text-amber-500 rounded-full mb-3">
          <i data-lucide="calendar-days" class="w-6 h-6"></i>
        </div>
        <p class="text-sm font-semibold text-slate-700 dark:text-zinc-300">No tienes citas programadas</p>
        <p class="text-xs text-slate-400 dark:text-zinc-500 mt-1">¡Selecciona un servicio abajo para reservar hoy!</p>
      </div>
    `;

    if (upcoming.length > 0) {
      // Sort upcoming by date and time
      upcoming.sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`));
      const next = upcoming[0];
      nextAppointmentHtml = `
        <div class="bg-gradient-to-br from-amber-500 to-amber-600 dark:from-amber-600 dark:to-amber-800 rounded-3xl p-6 text-zinc-950 dark:text-zinc-50 shadow-xl shadow-amber-500/10 flex flex-col justify-between h-full min-h-[180px] relative overflow-hidden group">
          <div class="absolute -right-6 -bottom-6 text-zinc-950/10 dark:text-white/10 group-hover:scale-110 transition-transform duration-500">
            <i data-lucide="scissors" class="w-32 h-32 rotate-12"></i>
          </div>
          <div class="relative z-10">
            <span class="px-2.5 py-1 bg-white/20 dark:bg-zinc-950/20 rounded-full text-[10px] font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-200">
              Próxima Cita
            </span>
            <h4 class="text-2xl font-display font-extrabold tracking-tight mt-3">${next.serviceName}</h4>
            <p class="text-xs text-zinc-900/80 dark:text-zinc-300/90 font-semibold mt-1">Con ${next.barberName}</p>
          </div>
          
          <div class="mt-4 flex items-center space-x-6 relative z-10 pt-4 border-t border-white/20 dark:border-zinc-50/10">
            <div class="flex items-center space-x-2">
              <i data-lucide="calendar" class="w-4 h-4 text-zinc-900 dark:text-amber-300"></i>
              <span class="text-xs font-bold">${next.date}</span>
            </div>
            <div class="flex items-center space-x-2">
              <i data-lucide="clock" class="w-4 h-4 text-zinc-900 dark:text-amber-300"></i>
              <span class="text-xs font-bold">${next.time} h</span>
            </div>
          </div>
        </div>
      `;
    }

    const services = window.mockService.getServices();
    const barbers = window.mockService.getBarbers();

    this.container.innerHTML = `
      <!-- Top Overview Row -->
      <div class="grid md:grid-cols-3 gap-6">
        
        <!-- Left: Quick Info Client Profile Card -->
        <div class="bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-zinc-800/80 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="font-display font-bold text-lg tracking-tight">Tu Ficha de Cliente</h3>
              <span class="text-[10px] bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 px-2 py-1 rounded-md font-bold uppercase">Datos</span>
            </div>
            
            <div class="space-y-2.5">
              <div class="flex items-center space-x-3 text-xs text-slate-600 dark:text-zinc-400">
                <i data-lucide="user" class="w-4 h-4 text-amber-500"></i>
                <span class="font-bold text-slate-800 dark:text-zinc-200">${user.name}</span>
              </div>
              <div class="flex items-center space-x-3 text-xs text-slate-600 dark:text-zinc-400">
                <i data-lucide="phone" class="w-4 h-4 text-amber-500"></i>
                <span>${user.phone}</span>
              </div>
              <div class="flex items-center space-x-3 text-xs text-slate-600 dark:text-zinc-400 font-medium truncate">
                <i data-lucide="mail" class="w-4 h-4 text-amber-500"></i>
                <span class="truncate">${user.email}</span>
              </div>
            </div>
          </div>

          <button onclick="window.appInstance.switchView('profile')" class="mt-4 w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 text-xs font-semibold rounded-xl transition-all-300 flex items-center justify-center space-x-1.5">
            <i data-lucide="edit" class="w-3.5 h-3.5"></i>
            <span>Actualizar Datos</span>
          </button>
        </div>

        <!-- Middle: Next Appointment Promo Banner -->
        <div class="md:col-span-2">
          ${nextAppointmentHtml}
        </div>

      </div>

      <!-- Booking Appointment Workflow Section -->
      <div class="bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-zinc-800/80 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
        
        <div class="border-b border-slate-100 dark:border-zinc-800/80 pb-4">
          <h3 class="text-xl font-display font-bold tracking-tight">Reservar una Nueva Cita</h3>
          <p class="text-xs text-slate-500 dark:text-zinc-400 mt-1">Completa los pasos interactivos para agendar tu espacio en la barbería.</p>
        </div>

        <!-- Step 1: Select Service -->
        <div class="space-y-3">
          <span class="inline-flex items-center text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
            <span class="w-5 h-5 rounded-full bg-amber-500 text-zinc-950 flex items-center justify-center text-[10px] font-bold mr-2">1</span>
            Selecciona el Servicio
          </span>
          
          <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            ${services.map(srv => `
              <button onclick="window.adminDashboardView.selectService('${srv.id}', this)" class="service-card p-4 text-left border border-slate-200 dark:border-zinc-800/80 hover:border-amber-500/40 dark:hover:border-amber-500/30 rounded-2xl transition-all-300 hover:shadow-md flex justify-between items-center bg-slate-50/50 dark:bg-zinc-950/20 group">
                <div class="space-y-1">
                  <p class="text-sm font-semibold group-hover:text-amber-500 transition-colors duration-300">${srv.name}</p>
                  <span class="text-xs text-slate-400 dark:text-zinc-500 flex items-center">
                    <i data-lucide="clock" class="w-3.5 h-3.5 mr-1 text-slate-300 dark:text-zinc-700"></i> ${srv.duration} min
                  </span>
                </div>
                <div class="text-right">
                  <p class="text-sm font-bold text-amber-600 dark:text-amber-400 font-display">${srv.price} €</p>
                </div>
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Step 2: Select Barber -->
        <div class="space-y-3 pt-2">
          <span class="inline-flex items-center text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
            <span class="w-5 h-5 rounded-full bg-amber-500 text-zinc-950 flex items-center justify-center text-[10px] font-bold mr-2">2</span>
            Selecciona tu Barbero
          </span>
          
          <div class="grid sm:grid-cols-3 gap-3">
            ${barbers.map(barb => `
              <button onclick="window.adminDashboardView.selectBarber('${barb.id}', this)" class="barber-card p-4 text-left border border-slate-200 dark:border-zinc-800/80 hover:border-amber-500/40 dark:hover:border-amber-500/30 rounded-2xl transition-all-300 hover:shadow-md flex items-center space-x-3 bg-slate-50/50 dark:bg-zinc-950/20 group">
                <div class="w-10 h-10 bg-amber-500/10 text-amber-500 font-display font-bold text-sm rounded-xl flex items-center justify-center border border-amber-500/20">
                  ${barb.name.split(' ').map(n=>n[0]).join('')}
                </div>
                <div class="min-w-0">
                  <p class="text-sm font-semibold group-hover:text-amber-500 transition-colors duration-300 truncate">${barb.name}</p>
                  <p class="text-[10px] text-slate-400 dark:text-zinc-500 truncate">${barb.role}</p>
                </div>
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Step 3 & 4: Date & Time Grid -->
        <div class="grid md:grid-cols-2 gap-6 pt-2">
          
          <!-- Datepicker -->
          <div class="space-y-3">
            <label for="booking-date" class="inline-flex items-center text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
              <span class="w-5 h-5 rounded-full bg-amber-500 text-zinc-950 flex items-center justify-center text-[10px] font-bold mr-2">3</span>
              Selecciona la Fecha
            </label>
            <div class="relative">
              <input type="date" id="booking-date" onchange="window.adminDashboardView.selectDate(this.value)" min="${new Date().toISOString().split('T')[0]}" class="w-full px-4 py-3 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 transition-all-300">
            </div>
          </div>

          <!-- Time Grid picker -->
          <div class="space-y-3">
            <span class="inline-flex items-center text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
              <span class="w-5 h-5 rounded-full bg-amber-500 text-zinc-950 flex items-center justify-center text-[10px] font-bold mr-2">4</span>
              Elige el Horario
            </span>

            <div class="grid grid-cols-4 gap-2" id="time-slots-container">
              ${['09:00', '10:00', '11:00', '12:00', '13:00', '16:00', '17:00', '18:00', '19:00', '20:00'].map(t => `
                <button onclick="window.adminDashboardView.selectTime('${t}', this)" class="time-slot-btn py-2 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-semibold hover:border-amber-500 hover:text-amber-500 bg-slate-50/50 dark:bg-zinc-950/20 transition-all-300">
                  ${t}
                </button>
              `).join('')}
            </div>
          </div>

        </div>

        <!-- Confirm Reservation action box -->
        <div class="pt-4 border-t border-slate-100 dark:border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div class="text-sm">
            <span class="text-slate-400 dark:text-zinc-500">Resumen:</span>
            <span id="booking-summary-text" class="font-bold text-slate-700 dark:text-zinc-300 ml-1">Ninguno seleccionado</span>
          </div>
          
          <button onclick="window.adminDashboardView.submitAppointment()" class="w-full sm:w-auto px-6 py-3.5 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-amber-600 dark:hover:bg-amber-500 dark:text-zinc-950 font-bold rounded-xl text-sm transition-all-300 shadow-lg dark:shadow-amber-900/20 active:scale-[0.98] flex items-center justify-center space-x-2">
            <i data-lucide="check" class="w-4 h-4"></i>
            <span>Confirmar Reservación</span>
          </button>
        </div>

      </div>
    `;

    // Reset workflow variables on drawing
    this.selectedService = null;
    this.selectedBarber = null;
    this.selectedDate = '';
    this.selectedTime = '';
  }

  // --- Workflow Booking handlers ---
  selectService(id, element) {
    document.querySelectorAll('.service-card').forEach(el => {
      el.classList.remove('border-amber-500', 'bg-amber-500/5', 'dark:bg-amber-500/5', 'dark:border-amber-500');
    });
    element.classList.add('border-amber-500', 'bg-amber-500/5', 'dark:bg-amber-500/5', 'dark:border-amber-500');
    this.selectedService = window.mockService.getServices().find(s => s.id === id);
    this.updateBookingSummary();
  }

  selectBarber(id, element) {
    document.querySelectorAll('.barber-card').forEach(el => {
      el.classList.remove('border-amber-500', 'bg-amber-500/5', 'dark:bg-amber-500/5', 'dark:border-amber-500');
    });
    element.classList.add('border-amber-500', 'bg-amber-500/5', 'dark:bg-amber-500/5', 'dark:border-amber-500');
    this.selectedBarber = window.mockService.getBarbers().find(b => b.id === id);
    this.updateBookingSummary();
  }

  selectDate(value) {
    this.selectedDate = value;
    this.updateBookingSummary();
  }

  selectTime(time, element) {
    document.querySelectorAll('.time-slot-btn').forEach(el => {
      el.classList.remove('border-amber-500', 'bg-amber-500/10', 'text-amber-500', 'dark:bg-amber-500/10');
    });
    element.classList.add('border-amber-500', 'bg-amber-500/10', 'text-amber-500', 'dark:bg-amber-500/10');
    this.selectedTime = time;
    this.updateBookingSummary();
  }

  updateBookingSummary() {
    const el = document.getElementById('booking-summary-text');
    if (!el) return;

    let parts = [];
    if (this.selectedService) parts.push(`💇 ${this.selectedService.name}`);
    if (this.selectedBarber) parts.push(`💈 con ${this.selectedBarber.name.split(' ')[0]}`);
    if (this.selectedDate) parts.push(`📅 ${this.selectedDate}`);
    if (this.selectedTime) parts.push(`⏰ ${this.selectedTime}h`);

    if (parts.length > 0) {
      el.textContent = parts.join(' | ');
      el.className = "font-bold text-amber-600 dark:text-amber-400 ml-1";
    } else {
      el.textContent = "Ninguno seleccionado";
      el.className = "font-bold text-slate-400 dark:text-zinc-500 ml-1";
    }
  }

  submitAppointment() {
    const user = window.mockService.getCurrentUser();
    if (!user) return;

    if (!this.selectedService || !this.selectedBarber || !this.selectedDate || !this.selectedTime) {
      window.appInstance.showToast('Por favor selecciona todos los pasos del 1 al 4.', 'error');
      return;
    }

    const apptData = {
      clientId: user.id,
      clientName: user.name,
      clientPhone: user.phone,
      clientEmail: user.email,
      serviceId: this.selectedService.id,
      barberId: this.selectedBarber.id,
      date: this.selectedDate,
      time: this.selectedTime
    };

    const res = window.mockService.createAppointment(apptData);
    if (res.success) {
      window.appInstance.showToast('¡Cita agendada correctamente!', 'success');
      this.render('dashboard'); // Re-draw
    } else {
      window.appInstance.showToast(res.message || 'Error al agendar cita', 'error');
    }
  }


  // ==========================================
  // --- ADMIN VIEW: DASHBOARD PRINCIPAL ---
  // ==========================================
  renderAdminDashboard(user) {
    const appointments = window.mockService.getAppointments();
    const clients = window.mockService.getClients();
    
    // Calculate Stats
    const totalCitas = appointments.length;
    const revenue = appointments.reduce((sum, a) => sum + a.price, 0);
    const clientsCount = clients.length;

    // Filter appointments by search query if any
    const filteredAppts = appointments.filter(a => 
      a.clientName.toLowerCase().includes(this.appointmentsSearchQuery.toLowerCase()) || 
      a.serviceName.toLowerCase().includes(this.appointmentsSearchQuery.toLowerCase())
    );

    // Dynamic right side container layout: check if a client detail is loaded, else fallback
    let clientDetailHtml = `
      <div class="bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-zinc-800/80 rounded-3xl p-6 text-center flex flex-col justify-center items-center h-full min-h-[300px]">
        <div class="p-3.5 bg-slate-100 dark:bg-zinc-800/60 text-slate-400 dark:text-zinc-500 rounded-full mb-3">
          <i data-lucide="user-square" class="w-6 h-6"></i>
        </div>
        <p class="text-sm font-semibold text-slate-700 dark:text-zinc-300">Ficha de Cliente Detallada</p>
        <p class="text-xs text-slate-400 dark:text-zinc-500 max-w-xs mt-1">Selecciona una cita o busca un cliente para inspeccionar sus datos y realizar acciones rápidas.</p>
      </div>
    `;

    if (this.selectedClientInDetail) {
      const c = this.selectedClientInDetail;
      // Get count of historical visits for this client
      const visits = appointments.filter(a => a.clientId === c.id);
      
      clientDetailHtml = `
        <div class="bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-zinc-800/80 rounded-3xl p-6 shadow-sm space-y-5">
          <div class="flex items-start justify-between">
            <div class="flex items-center space-x-3">
              <div class="w-11 h-11 bg-amber-500/10 text-amber-500 rounded-xl flex items-center justify-center font-display font-bold">
                ${c.name.split(' ').map(n=>n[0]).join('')}
              </div>
              <div>
                <h4 class="text-base font-bold truncate max-w-[150px]" title="${c.name}">${c.name}</h4>
                <span class="text-[9px] uppercase font-bold tracking-wider text-slate-400 dark:text-zinc-500">ID: ${c.id.substring(0, 8)}</span>
              </div>
            </div>
            <button onclick="window.adminDashboardView.clearClientDetail()" class="p-1 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg text-slate-400 dark:text-zinc-500">
              <i data-lucide="x" class="w-4 h-4"></i>
            </button>
          </div>

          <div class="space-y-3 border-t border-b border-slate-100 dark:border-zinc-800/60 py-4 text-xs">
            <div class="flex justify-between items-center">
              <span class="text-slate-400 dark:text-zinc-500">Teléfono (WhatsApp)</span>
              <span class="font-semibold text-slate-700 dark:text-zinc-200">${c.phone}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-slate-400 dark:text-zinc-500">Correo Electrónico</span>
              <span class="font-semibold text-slate-700 dark:text-zinc-200 truncate max-w-[170px]" title="${c.email}">${c.email}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-slate-400 dark:text-zinc-500">Última Visita</span>
              <span class="font-semibold text-slate-700 dark:text-zinc-200">${c.lastVisit || 'N/A'}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-slate-400 dark:text-zinc-500">Historial Citas</span>
              <span class="px-2 py-0.5 bg-amber-500/10 text-amber-500 rounded font-bold">${visits.length} citas</span>
            </div>
          </div>

          <!-- Quick Actions Panel inside Customer File -->
          <div class="space-y-2">
            <p class="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-zinc-500">Acciones Rápidas</p>
            
            ${visits.length > 0 && visits.find(v=>v.status === 'scheduled') ? `
              <button onclick="window.adminDashboardView.triggerWhatsAppReminder('${visits.find(v=>v.status === 'scheduled').id}')" class="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all-300 shadow-md shadow-emerald-600/10 flex items-center justify-center space-x-2">
                <i data-lucide="message-square" class="w-4 h-4"></i>
                <span>Enviar recordatorio WhatsApp</span>
              </button>
            ` : `
              <button disabled class="w-full py-3 px-4 bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-600 font-bold rounded-xl text-xs flex items-center justify-center space-x-2 cursor-not-allowed">
                <i data-lucide="message-square" class="w-4 h-4"></i>
                <span>Sin citas pendientes de envío</span>
              </button>
            `}

            <a href="mailto:${c.email}" class="w-full py-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-zinc-800/40 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-300 text-xs font-semibold rounded-xl transition-all-300 border border-slate-200 dark:border-zinc-800 flex items-center justify-center space-x-1.5">
              <i data-lucide="mail-plus" class="w-4 h-4 text-amber-500"></i>
              <span>Enviar Correo</span>
            </a>
          </div>
        </div>
      `;
    }

    this.container.innerHTML = `
      <!-- KPI Stats Grid Row -->
      <div class="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <div class="bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-zinc-800/80 rounded-2xl md:rounded-3xl p-5 shadow-sm flex items-center space-x-4">
          <div class="p-3 bg-amber-500/10 text-amber-500 rounded-xl md:rounded-2xl">
            <i data-lucide="calendar" class="w-5 h-5 md:w-6 h-6"></i>
          </div>
          <div>
            <p class="text-2xl md:text-3xl font-display font-extrabold tracking-tight">${totalCitas}</p>
            <p class="text-[10px] md:text-xs text-slate-400 dark:text-zinc-500 uppercase font-bold tracking-wider mt-0.5">Total Citas</p>
          </div>
        </div>

        <div class="bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-zinc-800/80 rounded-2xl md:rounded-3xl p-5 shadow-sm flex items-center space-x-4">
          <div class="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl md:rounded-2xl">
            <i data-lucide="euro" class="w-5 h-5 md:w-6 h-6"></i>
          </div>
          <div>
            <p class="text-2xl md:text-3xl font-display font-extrabold tracking-tight">${revenue} €</p>
            <p class="text-[10px] md:text-xs text-slate-400 dark:text-zinc-500 uppercase font-bold tracking-wider mt-0.5">Ingresos Estimados</p>
          </div>
        </div>

        <div class="bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-zinc-800/80 rounded-2xl md:rounded-3xl p-5 shadow-sm flex items-center space-x-4 col-span-2 lg:col-span-1">
          <div class="p-3 bg-blue-500/10 text-blue-500 rounded-xl md:rounded-2xl">
            <i data-lucide="users" class="w-5 h-5 md:w-6 h-6"></i>
          </div>
          <div>
            <p class="text-2xl md:text-3xl font-display font-extrabold tracking-tight">${clientsCount}</p>
            <p class="text-[10px] md:text-xs text-slate-400 dark:text-zinc-500 uppercase font-bold tracking-wider mt-0.5">Clientes Registrados</p>
          </div>
        </div>
      </div>

      <!-- Main Layout Body split: Left Appointments, Right Client Detailed File -->
      <div class="grid lg:grid-cols-3 gap-6 items-start">
        
        <!-- Left: Appointment List table container -->
        <div class="lg:col-span-2 bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-zinc-800/80 rounded-3xl p-6 shadow-sm space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 class="font-display font-bold text-lg tracking-tight">Listado General de Citas</h3>
              <p class="text-[10px] text-slate-400 dark:text-zinc-500">Supervisa las reservas pendientes y gestiona recordatorios.</p>
            </div>
            
            <!-- Search bar -->
            <div class="relative max-w-xs w-full">
              <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <i data-lucide="search" class="w-4 h-4"></i>
              </span>
              <input type="text" placeholder="Buscar por cliente/servicio..." oninput="window.adminDashboardView.searchAppointments(this.value)" value="${this.appointmentsSearchQuery}" class="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-amber-500/40 transition-all-300">
            </div>
          </div>

          <!-- Appointments List Grid -->
          <div class="space-y-2 max-h-[500px] overflow-y-auto pr-1 no-scrollbar">
            ${filteredAppts.length === 0 ? `
              <div class="p-8 text-center text-slate-400 dark:text-zinc-500 text-xs">
                No se encontraron citas programadas
              </div>
            ` : filteredAppts.map(appt => `
              <div onclick="window.adminDashboardView.loadClientDetail('${appt.clientId}')" class="p-4 bg-slate-50/50 dark:bg-zinc-950/20 border border-slate-200/60 dark:border-zinc-800/60 hover:border-amber-500/50 dark:hover:border-amber-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 cursor-pointer hover:shadow-sm transition-all duration-300 group">
                <div class="flex items-center space-x-3.5 min-w-0">
                  <div class="p-2 bg-amber-500/10 text-amber-500 rounded-xl group-hover:bg-amber-500 group-hover:text-zinc-950 transition-colors duration-300">
                    <i data-lucide="scissors" class="w-4.5 h-4.5"></i>
                  </div>
                  <div class="min-w-0">
                    <h5 class="font-bold text-xs group-hover:text-amber-500 transition-colors duration-300 truncate">${appt.clientName}</h5>
                    <p class="text-[10px] text-slate-400 dark:text-zinc-500 truncate mt-0.5">${appt.serviceName} con ${appt.barberName.split(' ')[0]}</p>
                  </div>
                </div>

                <div class="flex items-center justify-between sm:justify-end space-x-6">
                  <!-- Date/Time Display -->
                  <div class="text-left sm:text-right">
                    <span class="block text-xs font-bold text-slate-700 dark:text-zinc-300">${appt.date}</span>
                    <span class="inline-flex items-center text-[10px] font-semibold text-slate-400 dark:text-zinc-500 mt-0.5">
                      <i data-lucide="clock" class="w-3 h-3 mr-0.5"></i> ${appt.time} h
                    </span>
                  </div>

                  <!-- Action Buttons -->
                  <div class="flex items-center space-x-2" onclick="event.stopPropagation()">
                    <button onclick="window.adminDashboardView.triggerWhatsAppReminder('${appt.id}')" class="p-2 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-600 dark:text-emerald-400 hover:text-white rounded-lg transition-all duration-300" title="Enviar recordatorio WhatsApp">
                      <i data-lucide="message-square" class="w-4 h-4"></i>
                    </button>
                    <button onclick="window.adminDashboardView.cancelAppointment('${appt.id}')" class="p-2 bg-rose-500/10 hover:bg-rose-600 text-rose-600 dark:text-rose-400 hover:text-white rounded-lg transition-all duration-300" title="Cancelar Cita">
                      <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Right: Client detailed file view -->
        <div class="lg:col-span-1">
          ${clientDetailHtml}
        </div>

      </div>
    `;
  }

  // --- Search / Filters inside admin list ---
  searchAppointments(query) {
    this.appointmentsSearchQuery = query;
    // Debounce/Re-render immediately
    const user = window.mockService.getCurrentUser();
    this.renderAdminDashboard(user);
    if (window.lucide) window.lucide.createIcons();
  }

  // --- Dynamic Client Detail Loader inside admin panel ---
  loadClientDetail(clientId) {
    const client = window.mockService.getClientById(clientId);
    if (client) {
      this.selectedClientInDetail = client;
      const user = window.mockService.getCurrentUser();
      this.renderAdminDashboard(user);
      if (window.lucide) window.lucide.createIcons();
    }
  }

  clearClientDetail() {
    this.selectedClientInDetail = null;
    const user = window.mockService.getCurrentUser();
    this.renderAdminDashboard(user);
    if (window.lucide) window.lucide.createIcons();
  }

  // --- Action triggers ---
  cancelAppointment(apptId) {
    if (confirm('¿Estás seguro de que deseas cancelar esta cita?')) {
      const res = window.mockService.cancelAppointment(apptId);
      if (res.success) {
        window.appInstance.showToast('Cita cancelada correctamente', 'success');
        this.render('dashboard'); // Re-draw current view
      } else {
        window.appInstance.showToast(res.message || 'Error al cancelar cita', 'error');
      }
    }
  }


  // ==========================================
  // --- SUBVIEW: LISTADO DE CITAS (FULL) ---
  // ==========================================
  renderAppointmentsView(user) {
    let appointments = [];
    if (user.role === 'admin') {
      appointments = window.mockService.getAppointments();
    } else {
      appointments = window.mockService.getAppointmentsByClient(user.id);
    }

    // Separate upcoming vs history
    const todayStr = new Date().toISOString().split('T')[0];
    const upcoming = appointments.filter(a => a.status === 'scheduled');
    const past = appointments.filter(a => a.status === 'completed' || a.date < todayStr);

    this.container.innerHTML = `
      <div class="bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-zinc-800/80 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
        
        <div>
          <h3 class="font-display font-bold text-xl tracking-tight">Historial de Reservaciones</h3>
          <p class="text-xs text-slate-500 dark:text-zinc-400 mt-1">Inspecciona todas tus citas y revisa el estado del servicio.</p>
        </div>

        <!-- Upcoming appointments -->
        <div class="space-y-3">
          <span class="inline-flex items-center text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
            Citas Pendientes (${upcoming.length})
          </span>

          <div class="grid md:grid-cols-2 gap-4">
            ${upcoming.length === 0 ? `
              <div class="col-span-2 p-6 bg-slate-50/50 dark:bg-zinc-950/20 border border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl text-center text-xs text-slate-400 dark:text-zinc-500">
                No tienes citas pendientes programadas.
              </div>
            ` : upcoming.map(appt => `
              <div class="p-5 bg-slate-50/50 dark:bg-zinc-950/20 border border-slate-200 dark:border-zinc-800/80 rounded-2xl flex justify-between items-start">
                <div class="space-y-2">
                  <span class="px-2.5 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-500 border border-amber-500/20 rounded text-[9px] font-bold uppercase tracking-wider">
                    Programada
                  </span>
                  <div>
                    <h5 class="font-bold text-sm text-slate-800 dark:text-zinc-100">${appt.serviceName}</h5>
                    <p class="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">Con ${appt.barberName}</p>
                    ${user.role === 'admin' ? `<p class="text-[10px] text-amber-500 mt-1">Cliente: ${appt.clientName}</p>` : ''}
                  </div>
                  <div class="flex items-center space-x-4 pt-1.5 text-xs font-bold">
                    <span class="flex items-center text-slate-600 dark:text-zinc-300">
                      <i data-lucide="calendar" class="w-3.5 h-3.5 mr-1 text-slate-400"></i> ${appt.date}
                    </span>
                    <span class="flex items-center text-slate-600 dark:text-zinc-300">
                      <i data-lucide="clock" class="w-3.5 h-3.5 mr-1 text-slate-400"></i> ${appt.time} h
                    </span>
                  </div>
                </div>

                <div class="flex flex-col items-end justify-between h-full space-y-4">
                  <span class="text-base font-bold text-slate-700 dark:text-zinc-200 font-display">${appt.price} €</span>
                  <div class="flex space-x-1.5">
                    ${user.role === 'admin' ? `
                      <button onclick="window.adminDashboardView.triggerWhatsAppReminder('${appt.id}')" class="p-2 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-600 dark:text-emerald-400 hover:text-white rounded-lg transition-all duration-300" title="WhatsApp recordatorio">
                        <i data-lucide="message-square" class="w-4 h-4"></i>
                      </button>
                    ` : ''}
                    <button onclick="window.adminDashboardView.cancelAppointment('${appt.id}')" class="p-2 bg-rose-500/10 hover:bg-rose-600 text-rose-600 dark:text-rose-400 hover:text-white rounded-lg transition-all duration-300" title="Cancelar">
                      <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Past appointments -->
        <div class="space-y-3 pt-2">
          <span class="inline-flex items-center text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
            Citas Pasadas
          </span>

          <div class="space-y-2">
            ${past.length === 0 ? `
              <div class="p-6 text-center text-xs text-slate-400 dark:text-zinc-500">
                Ninguna cita histórica registrada.
              </div>
            ` : past.map(appt => `
              <div class="p-4 bg-slate-50/20 dark:bg-zinc-950/10 border border-slate-200/50 dark:border-zinc-800/50 rounded-xl flex items-center justify-between text-xs">
                <div class="flex items-center space-x-3">
                  <div class="p-2 bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 rounded-lg">
                    <i data-lucide="check-circle" class="w-4 h-4"></i>
                  </div>
                  <div>
                    <p class="font-semibold text-slate-700 dark:text-zinc-200">${appt.serviceName}</p>
                    <p class="text-[10px] text-slate-400 dark:text-zinc-500">Con ${appt.barberName} | ${appt.date} a las ${appt.time} h</p>
                  </div>
                </div>
                <div class="text-right">
                  <span class="font-bold text-slate-600 dark:text-zinc-300">${appt.price} €</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

      </div>
    `;
  }


  // ==========================================
  // --- SUBVIEW: MIS DATOS / CONFIGURACIÓN ---
  // ==========================================
  renderProfileView(user) {
    this.container.innerHTML = `
      <div class="bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-zinc-800/80 rounded-3xl p-6 md:p-8 shadow-sm max-w-2xl mx-auto space-y-6">
        
        <div>
          <h3 class="font-display font-bold text-xl tracking-tight">Ficha Personal / Mis Datos</h3>
          <p class="text-xs text-slate-500 dark:text-zinc-400 mt-1">Gestiona tu información de contacto personal. Estos datos se utilizarán para la creación de recordatorios y confirmación de citas.</p>
        </div>

        <form id="profile-edit-form" class="space-y-4">
          <div>
            <label for="profile-name" class="block text-xs font-semibold uppercase tracking-wider mb-2 text-slate-500 dark:text-zinc-400">Nombre Completo</label>
            <input type="text" id="profile-name" value="${user.name}" required class="w-full px-4 py-3 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 transition-all-300">
          </div>

          <div class="grid sm:grid-cols-2 gap-4">
            <div>
              <label for="profile-phone" class="block text-xs font-semibold uppercase tracking-wider mb-2 text-slate-500 dark:text-zinc-400">Teléfono (WhatsApp)</label>
              <input type="tel" id="profile-phone" value="${user.phone}" required class="w-full px-4 py-3 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 transition-all-300">
            </div>

            <div>
              <label for="profile-email" class="block text-xs font-semibold uppercase tracking-wider mb-2 text-slate-500 dark:text-zinc-400">Correo Electrónico</label>
              <input type="email" id="profile-email" value="${user.email}" required class="w-full px-4 py-3 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 transition-all-300">
            </div>
          </div>

          <div class="pt-4 border-t border-slate-100 dark:border-zinc-800/80 flex justify-end">
            <button type="submit" class="w-full sm:w-auto px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-amber-600 dark:hover:bg-amber-500 dark:text-zinc-950 font-bold rounded-xl text-sm transition-all-300 flex items-center justify-center space-x-2">
              <i data-lucide="save" class="w-4 h-4"></i>
              <span>Guardar Cambios</span>
            </button>
          </div>
        </form>

      </div>
    `;

    // Handle Form Submit
    const form = document.getElementById('profile-edit-form');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('profile-name').value;
      const phone = document.getElementById('profile-phone').value;
      const email = document.getElementById('profile-email').value;

      const res = window.mockService.updateClientProfile(user.id, name, phone, email);
      if (res.success) {
        window.appInstance.currentUser = res.client;
        // Update user displays in main window
        document.getElementById('user-display-name').textContent = res.client.name;
        window.appInstance.showToast('Perfil actualizado con éxito', 'success');
        this.render('profile');
      } else {
        window.appInstance.showToast(res.message || 'Error al actualizar perfil', 'error');
      }
    });
  }


  // ==========================================
  // --- DIALOGS: WHATSAPP RECORDATORIO MODAL ---
  // ==========================================
  setupWhatsAppModal() {
    // Bind modal actions
    setTimeout(() => {
      this.waModal = document.getElementById('whatsapp-modal');
      this.waModalCard = document.getElementById('whatsapp-modal-card');
      this.waCloseBtn = document.getElementById('close-wa-modal');
      this.waCloseBtn2 = document.getElementById('close-wa-modal-btn');
      this.waConfirmBtn = document.getElementById('confirm-wa-btn');
      this.waPreview = document.getElementById('wa-message-preview');

      const closeModal = () => {
        this.waModalCard.classList.remove('scale-100', 'opacity-100');
        this.waModalCard.classList.add('scale-95', 'opacity-0');
        setTimeout(() => {
          this.waModal.classList.add('hidden');
        }, 150);
      };

      if (this.waCloseBtn) this.waCloseBtn.addEventListener('click', closeModal);
      if (this.waCloseBtn2) this.waCloseBtn2.addEventListener('click', closeModal);
      if (this.waConfirmBtn) this.waConfirmBtn.addEventListener('click', closeModal);
    }, 100);
  }

  triggerWhatsAppReminder(apptId) {
    const appointment = window.mockService.getAppointments().find(a => a.id === apptId);
    if (!appointment) return;

    const waUrl = window.mockService.generateWhatsAppUrl(appointment);
    
    // Prepare message preview text inside modal
    const messageText = decodeURIComponent(waUrl.split('?text=')[1]);
    this.waPreview.textContent = messageText;
    this.waConfirmBtn.href = waUrl;

    // Show modal with animation
    this.waModal.classList.remove('hidden');
    setTimeout(() => {
      this.waModalCard.classList.remove('scale-95', 'opacity-0');
      this.waModalCard.classList.add('scale-100', 'opacity-100');
    }, 50);
  }
}

// Instantiate View system globally
document.addEventListener('DOMContentLoaded', () => {
  window.adminDashboardView = new AdminDashboardView();
});

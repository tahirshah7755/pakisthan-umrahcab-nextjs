// UmrahCab Central API Utility for Next.js Frontend
import { countryCodesList } from "./countriesData";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/umrahcab";

// Helper to handle requests with fallback to local mock state
async function request(endpoint: string, options: RequestInit = {}) {
  try {
    let token = null;
    if (typeof window !== "undefined") {
      const isCompanyRoute = window.location.pathname.startsWith("/company") ||
        window.location.search.includes("type=company") ||
        endpoint.startsWith("/company-panel") ||
        endpoint.startsWith("company-panel");
      const isDriverRoute = window.location.pathname.startsWith("/driver") ||
        endpoint.startsWith("/driver-panel") ||
        endpoint.startsWith("driver-panel") ||
        endpoint.startsWith("/auth/driver") ||
        endpoint.startsWith("auth/driver");
      if (isDriverRoute) {
        token = localStorage.getItem("umrahcab_driver_token");
      } else if (isCompanyRoute) {
        token = localStorage.getItem("umrahcab_company_token") || localStorage.getItem("umrahcab_token");
      } else {
        token = localStorage.getItem("umrahcab_token") || localStorage.getItem("umrahcab_company_token");
      }
    }

    const headers = new Headers();
    if (!(options.body instanceof FormData)) {
      headers.append("Content-Type", "application/json");
    }
    if (token) {
      headers.append("Authorization", `Bearer ${token}`);
    }
    if (options.headers) {
      const extraHeaders = new Headers(options.headers);
      extraHeaders.forEach((value, key) => {
        headers.set(key, value);
      });
    }

    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
      credentials: "include",
    });
    if (!res.ok) {
      if (res.status === 401) {
        if (typeof window !== "undefined") {
          const pathname = window.location.pathname;
          if (pathname.startsWith("/driver")) {
            localStorage.removeItem("umrahcab_driver_user");
            localStorage.removeItem("umrahcab_driver_token");
            window.location.href = "/driver/login";
          } else if (pathname.startsWith("/company")) {
            localStorage.removeItem("umrahcab_company_user");
            localStorage.removeItem("umrahcab_company_token");
            window.location.href = "/company/login";
          } else {
            localStorage.removeItem("umrahcab_user");
            localStorage.removeItem("umrahcab_token");
            localStorage.removeItem("umrahcab_extras_unlocked");
            window.location.href = "/login";
          }
        }
      }
      
      let errorMessage = `HTTP Error: ${res.status}`;
      try {
        const errorJson = await res.json();
        errorMessage = errorJson?.Message || errorJson?.message || errorJson?.error || errorMessage;
      } catch (_) {}

      const httpError = new Error(errorMessage);
      (httpError as any).status = res.status;
      throw httpError;
    }
    const json = await res.json();
    if (json && typeof json === "object" && "status_code" in json && "data" in json) {
      return json.data;
    }
    return json;
  } catch (error: any) {
    console.warn(`Laravel API connection failed on ${endpoint}.`, error);
    if (error && typeof error === "object" && "status" in error) {
      throw error;
    }
    return null;
  }
}

export const api = {
  // Bookings
  async getBookings(search?: string, page?: number, perPage?: number) {
    const q = new URLSearchParams();
    if (search) q.append("search", search);
    if (page !== undefined) q.append("page", String(page));
    if (perPage !== undefined) q.append("per_page", String(perPage));
    const data = await request(`/bookings?${q.toString()}`);
    return data;
  },

  async getBooking(id: string) {
    const data = await request(`/bookings/${id}`);
    return data;
  },

  async createBooking(bookingData: any) {
    const data = await request(`/bookings`, {
      method: "POST",
      body: JSON.stringify(bookingData),
    });
    if (data) return { success: true, data };
    return { success: false, error: "API connection failed" };
  },

  async updateBooking(id: string, bookingData: any) {
    const data = await request(`/bookings/${id}`, {
      method: "PUT",
      body: JSON.stringify(bookingData),
    });
    if (data) return { success: true, data };
    return { success: false, error: "API connection failed" };
  },

  async getBookingStatus(code: string) {
    const data = await request(`/bookings/status/${encodeURIComponent(code)}`);
    return data || [];
  },

  async getDashboardSummary() {
    const data = await request(`/bookings/summary`);
    if (data) return data;
    return {
      total: 0,
      active: 0,
      confirmed: 0,
      pending: 0,
      list: []
    };
  },

  async getUpcomingReminders() {
    const data = await request(`/bookings/upcoming-reminders`);
    return data || [];
  },

  async getRemindersList(date: string) {
    const data = await request(`/bookings/reminders-list?date=${encodeURIComponent(date)}`);
    return data || [];
  },

  async markReminderSent(id: string | number, type: string, templateId: number) {
    const data = await request(`/bookings/reminders-list/mark-sent`, {
      method: "POST",
      body: JSON.stringify({ id, type, template_id: templateId }),
    });
    return data;
  },

  async getReminderHistory(id: string | number, type: string) {
    const data = await request(`/bookings/reminders-list/${id}/history?type=${encodeURIComponent(type)}`);
    return data;
  },

  // Customers
  async getCustomers(search?: string, company?: string, page?: number, perPage?: number) {
    const q = new URLSearchParams();
    if (search) q.append("search", search);
    if (company) q.append("company", company);
    if (page !== undefined) q.append("page", String(page));
    if (perPage !== undefined) q.append("per_page", String(perPage));
    const data = await request(`/customers?${q.toString()}`);
    return data;
  },

  async getCustomer(id: string) {
    const isCompany = typeof window !== "undefined" && (window.location.pathname.startsWith("/company") || window.location.search.includes("type=company"));
    const data = await request(isCompany ? `/company-panel/customers/${id}` : `/customers/${id}`);
    return data || null;
  },

  async createCustomer(cust: any) {
    const data = await request(`/customers`, {
      method: "POST",
      body: JSON.stringify(cust),
    });
    if (data) return { success: true, data };
    return { success: false, error: "API connection failed" };
  },

  async updateCustomer(id: string, cust: any) {
    const data = await request(`/customers/${id}`, {
      method: "PUT",
      body: JSON.stringify(cust),
    });
    if (data) return { success: true, data };
    return { success: false, error: "API connection failed" };
  },

  // Companies
  async getCompanies() {
    const data = await request(`/companies`);
    return data || [];
  },

  async getCompany(id: string) {
    const data = await request(`/companies/${id}`);
    return data || null;
  },

  async createCompany(comp: any) {
    const data = await request(`/companies`, {
      method: "POST",
      body: JSON.stringify(comp),
    });
    if (data) return { success: true, data };
    return { success: false, error: "API connection failed" };
  },

  async updateCompany(id: string, comp: any) {
    const data = await request(`/companies/${id}`, {
      method: "PUT",
      body: JSON.stringify(comp),
    });
    if (data) return { success: true, data };
    return { success: false, error: "API connection failed" };
  },

  // Services
  async getServices(search?: string, type?: string, page?: number, perPage?: number, status?: string, catalog?: boolean) {
    const q = new URLSearchParams();
    if (search) q.append("search", search);
    if (type) q.append("type", type);
    if (page !== undefined) q.append("page", String(page));
    if (perPage !== undefined) q.append("per_page", String(perPage));
    if (status) q.append("status", status);
    if (catalog) q.append("catalog", "true");
    const data = await request(`/services?${q.toString()}`);
    return data;
  },

  async getService(id: string) {
    const data = await request(`/services/${id}`);
    return data || null;
  },

  async createService(srv: any) {
    const data = await request(`/services`, {
      method: "POST",
      body: JSON.stringify(srv),
    });
    if (data) return { success: true, data };
    return { success: false, error: "API connection failed" };
  },

  async deleteService(id: string) {
    const data = await request(`/services/${id}`, {
      method: "DELETE"
    });
    if (data) return { success: true };
    return { success: false };
  },

  async updateService(id: string, srv: any) {
    const data = await request(`/services/${id}`, {
      method: "PUT",
      body: JSON.stringify(srv),
    });
    if (data) return { success: true, data };
    return { success: false, error: "API connection failed" };
  },

  // Flights
  async getFlights(search?: string, leg?: string, page?: number, perPage?: number, status?: string, startDate?: string, endDate?: string) {
    const q = new URLSearchParams();
    if (search) q.append("search", search);
    if (leg) q.append("leg", leg);
    if (page !== undefined) q.append("page", String(page));
    if (perPage !== undefined) q.append("per_page", String(perPage));
    if (status) q.append("status", status);
    if (startDate) q.append("start_date", startDate);
    if (endDate) q.append("end_date", endDate);
    const data = await request(`/flights?${q.toString()}`);
    return data;
  },

  async createFlight(flt: any) {
    const data = await request(`/flights`, {
      method: "POST",
      body: JSON.stringify(flt),
    });
    if (data) return { success: true, data };
    return { success: false, error: "API connection failed" };
  },

  async getFlight(id: string | number) {
    const data = await request(`/flights/${id}`);
    return data || null;
  },

  async updateFlight(id: string | number, flt: any) {
    const data = await request(`/flights/${id}`, {
      method: "PUT",
      body: JSON.stringify(flt),
    });
    if (data) return { success: true, data };
    return { success: false, error: "API connection failed" };
  },

  async deleteFlight(id: string | number) {
    const data = await request(`/flights/${id}`, {
      method: "DELETE",
    });
    if (data) return { success: true, data };
    return { success: false, error: "API connection failed" };
  },

  // Trains
  async getTrains(search?: string, leg?: string, page?: number, perPage?: number, status?: string, startDate?: string, endDate?: string) {
    const q = new URLSearchParams();
    if (search) q.append("search", search);
    if (leg) q.append("leg", leg);
    if (page !== undefined) q.append("page", String(page));
    if (perPage !== undefined) q.append("per_page", String(perPage));
    if (status) q.append("status", status);
    if (startDate) q.append("start_date", startDate);
    if (endDate) q.append("end_date", endDate);
    const data = await request(`/trains?${q.toString()}`);
    return data;
  },

  async createTrain(trn: any) {
    const data = await request(`/trains`, {
      method: "POST",
      body: JSON.stringify(trn),
    });
    if (data) return { success: true, data };
    return { success: false, error: "API connection failed" };
  },

  async getTrain(id: string | number) {
    const data = await request(`/trains/${id}`);
    return data || null;
  },

  async updateTrain(id: string | number, trn: any) {
    const data = await request(`/trains/${id}`, {
      method: "PUT",
      body: JSON.stringify(trn),
    });
    if (data) return { success: true, data };
    return { success: false, error: "API connection failed" };
  },

  async deleteTrain(id: string | number) {
    const data = await request(`/trains/${id}`, {
      method: "DELETE",
    });
    if (data) return { success: true, data };
    return { success: false, error: "API connection failed" };
  },

  // Invoices
  async getInvoices() {
    const data = await request(`/invoices`);
    return data || [];
  },

  async createInvoice(inv: any) {
    const data = await request(`/invoices`, {
      method: "POST",
      body: JSON.stringify(inv),
    });
    if (data) return { success: true, data };
    return { success: false, error: "API connection failed" };
  },

  // Ledgers
  async getLedgers() {
    const data = await request(`/ledgers`);
    return data || [];
  },

  async createLedger(ld: any) {
    const data = await request(`/ledgers`, {
      method: "POST",
      body: JSON.stringify(ld),
    });
    if (data) return { success: true, data };
    return { success: false, error: "API connection failed" };
  },

  // Payments
  async getPayments() {
    const data = await request(`/payments`);
    return data || [];
  },

  async createPayment(pm: any) {
    const data = await request(`/payments`, {
      method: "POST",
      body: JSON.stringify(pm),
    });
    if (data) return { success: true, data };
    return { success: false, error: "API connection failed" };
  },

  // Notices
  async getNotices(target?: string) {
    const data = await request(`/notices${target ? `?target=${target}` : ""}`);
    return data || [];
  },

  async createNotice(nt: any) {
    const data = await request(`/notices`, {
      method: "POST",
      body: JSON.stringify(nt),
    });
    if (data) return { success: true, data };
    return { success: false, error: "API connection failed" };
  },

  // Fleet
  async getFleet() {
    const data = await request(`/fleet`);
    return data || [];
  },

  async updateFleet(id: number, count: number, active: number) {
    const data = await request(`/fleet/${id}`, {
      method: "PUT",
      body: JSON.stringify({ count, active }),
    });
    if (data) return { success: true, data };
    return { success: false, error: "API connection failed" };
  },

  async getHotels(city?: string, search?: string, type?: string) {
    const q = new URLSearchParams();
    if (city) q.append("city", city);
    if (search) q.append("search", search);
    if (type) q.append("type", type);
    const data = await request(`/hotels?${q.toString()}`);
    return data || [];
  },

  async createHotel(hotel: any) {
    const data = await request(`/hotels`, {
      method: "POST",
      body: JSON.stringify(hotel),
    });
    if (data) return { success: true, data };
    return { success: false, error: "API connection failed" };
  },

  async getHotel(id: string | number) {
    const data = await request(`/hotels/${id}`);
    return data || null;
  },

  async updateHotel(id: string | number, hotel: any) {
    const data = await request(`/hotels/${id}`, {
      method: "PUT",
      body: JSON.stringify(hotel),
    });
    if (data) return { success: true, data };
    return { success: false, error: "API connection failed" };
  },

  async deleteHotel(id: string | number) {
    const data = await request(`/hotels/${id}`, {
      method: "DELETE",
    });
    if (data) return { success: true, data };
    return { success: false, error: "API connection failed" };
  },

  // Audits
  async getAudits() {
    const data = await request(`/audits`);
    return data || [];
  },

  async logAudit(action: string) {
    const data = await request(`/audits`, {
      method: "POST",
      body: JSON.stringify({ performed_action: action }),
    });
    if (data) return { success: true, data };
    return { success: false, error: "API connection failed" };
  },

  // Followups
  async getFollowups() {
    const data = await request(`/followups`);
    return data || [];
  },

  async createFollowup(flp: any) {
    const data = await request(`/followups`, {
      method: "POST",
      body: JSON.stringify(flp),
    });
    if (data) return { success: true, data };
    return { success: false, error: "API connection failed" };
  },

  // Price List
  async getPriceList(groupName?: string) {
    const query = groupName ? `&group_name=${encodeURIComponent(groupName)}` : '';
    const data = await request(`/price-list?paginate=false${query}`);
    return data || [];
  },

  async getPriceGroups() {
    const data = await request(`/price-list/groups`);
    return data || [];
  },

  async getLocations() {
    const data = await request(`/locations`);
    return data || [];
  },

  async getPublicRates() {
    const data = await request(`/public-rates`);
    return data || [];
  },

  async updatePriceList(id: number, prices: any) {
    const data = await request(`/price-list/${id}`, {
      method: "PUT",
      body: JSON.stringify(prices),
    });
    if (data) return { success: true, data };
    return { success: false, error: "API connection failed" };
  },

  async applyBulkPriceList(bulk: any) {
    const data = await request(`/price-list/bulk`, {
      method: "POST",
      body: JSON.stringify(bulk),
    });
    if (data) return { success: true, data };
    return { success: false, error: "API connection failed" };
  },

  // B2B Company Agent specific methods
  async getCompanyDashboardSummary() {
    const data = await request(`/company-panel/dashboard-summary`);
    return data || null;
  },

  async uploadCompanyDocument(formData: FormData) {
    const data = await request(`/company-panel/upload-document`, {
      method: "POST",
      body: formData,
    });
    return data;
  },

  async getCompanyBookings(search?: string, page?: number, perPage?: number, filter?: string) {
    const q = new URLSearchParams();
    if (search) q.append("search", search);
    if (page !== undefined) q.append("page", String(page));
    if (perPage !== undefined) q.append("per_page", String(perPage));
    if (filter) q.append("filter", filter);
    const data = await request(`/company-panel/bookings?${q.toString()}`);
    return data;
  },

  async getCompanyCustomers(search?: string) {
    const data = await request(`/company-panel/customers${search ? `?search=${encodeURIComponent(search)}` : ""}`);
    return data || [];
  },

  async getCompanyCustomer(id: string | number) {
    const data = await request(`/company-panel/customers/${id}`);
    // Extract customer property if response has structure { customer, bookings, services... }
    if (data && data.customer) {
      return data.customer;
    }
    return data;
  },

  async createCompanyCustomer(cust: any) {
    const data = await request(`/company-panel/customers`, {
      method: "POST",
      body: JSON.stringify(cust),
    });
    if (data) return { success: true, data };
    return { success: false, error: "API connection failed" };
  },

  async getCompanyInvoices() {
    const data = await request(`/company-panel/invoices`);
    return data || [];
  },

  async getCompanyLedgers() {
    const data = await request(`/company-panel/ledgers`);
    return data || [];
  },

  async getCompanyClientLedger(params?: any) {
    const q = new URLSearchParams();
    if (params?.search) q.append("search", params.search);
    if (params?.start_date) q.append("start_date", params.start_date);
    if (params?.end_date) q.append("end_date", params.end_date);
    const data = await request(`/company-panel/client-ledger?${q.toString()}`);
    return data || { success: false, summary: {}, data: [] };
  },

  async updateCompanyBookingPayment(id: string | number, receivedAmount: number) {
    const data = await request(`/company-panel/bookings/${id}/payment`, {
      method: "PUT",
      body: JSON.stringify({ received_amount: receivedAmount }),
    });
    return data;
  },

  async updateAdminBookingPayment(id: string | number, receivedAmount: number) {
    const data = await request(`/bookings/${id}`, {
      method: "PUT",
      body: JSON.stringify({ received_amount: receivedAmount }),
    });
    return data;
  },




  async getCompanyPayments(status?: string) {
    const q = new URLSearchParams();
    if (status && status !== "all") q.append("status", status);
    const data = await request(`/company-panel/payments?${q.toString()}`);
    return data || [];
  },

  async updatePaymentStatus(id: string, status: string) {
    const data = await request(`/payments/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
    if (data) return { success: true, data };
    return { success: false, error: "API connection failed" };
  },

  async createCompanyPayment(payload: FormData | any) {
    const isFormData = payload instanceof FormData;
    const data = await request(`/company-panel/payments`, {
      method: "POST",
      body: isFormData ? payload : JSON.stringify(payload),
    });
    if (data) return { success: true, data };
    return { success: false, error: "API connection failed" };
  },

  // Chat Support - B2B Agent
  async getCompanyChatMessages() {
    const data = await request(`/company-panel/chat`);
    return data || [];
  },

  async sendCompanyChatMessage(formData: FormData) {
    const data = await request(`/company-panel/chat`, {
      method: "POST",
      body: formData,
    });
    if (data) return { success: true, data };
    return { success: false, error: "API connection failed" };
  },

  // Chat Support - Admin
  async getAdminChatRooms() {
    const data = await request(`/chat/admin`);
    return data || [];
  },

  async getAdminChatMessages(companyId: number | string) {
    const data = await request(`/chat/admin/${companyId}`);
    return data || [];
  },

  async sendAdminChatMessage(companyId: number | string, formData: FormData) {
    const data = await request(`/chat/admin/${companyId}`, {
      method: "POST",
      body: formData,
    });
    if (data) return { success: true, data };
    return { success: false, error: "API connection failed" };
  },

  async searchExternalLocations(query: string): Promise<string[]> {
    if (!query || query.length < 3) return [];
    try {
      const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=10`);
      if (!res.ok) return [];
      const data = await res.json();
      if (data && Array.isArray(data.features)) {
        const results = data.features.map((f: any) => {
          const name = f.properties.name || "";
          const city = f.properties.city || f.properties.state || "";
          const country = f.properties.country || "";
          // Remove duplicates within the parts
          const parts = [name, city, country].filter(Boolean);
          const uniqueParts = parts.filter((val, index, self) => self.indexOf(val) === index);
          return uniqueParts.join(", ");
        });
        // Remove duplicate full strings from the array
        return Array.from(new Set(results));
      }
      return [];
    } catch (err) {
      console.warn("External location search failed:", err);
      return [];
    }
  },

  // === DRIVER PORTAL & ENTRIES (DRIVER SIDE) ===
  async getMyDriverEntries() {
    const data = await request(`/driver-panel/entries`);
    return data || [];
  },

  async submitDriverEntry(entryData: any) {
    const data = await request(`/driver-panel/entries`, {
      method: "POST",
      body: JSON.stringify(entryData),
    });
    if (data) return { success: true, data };
    return { success: false, error: "API connection failed" };
  },

  async updateMyDriverEntry(id: number | string, entryData: any) {
    const data = await request(`/driver-panel/entries/${id}`, {
      method: "PUT",
      body: JSON.stringify(entryData),
    });
    if (data) return { success: true, data };
    return { success: false, error: data?.message || "API connection failed" };
  },

  // === DRIVERS MANAGEMENT (ADMIN SIDE) ===
  async getDrivers() {
    const isCompany = typeof window !== "undefined" && window.location.pathname.startsWith("/company");
    const prefix = isCompany ? "/company-panel" : "/admin";
    const data = await request(`${prefix}/drivers`);
    return data || [];
  },

  async createDriver(driverData: any) {
    const data = await request(`/admin/drivers`, {
      method: "POST",
      body: JSON.stringify(driverData),
    });
    if (data) return { success: true, data };
    return { success: false, error: "API connection failed" };
  },

  async updateDriver(id: number | string, driverData: any) {
    const data = await request(`/admin/drivers/${id}`, {
      method: "PUT",
      body: JSON.stringify(driverData),
    });
    if (data) return { success: true, data };
    return { success: false, error: "API connection failed" };
  },

  async deleteDriver(id: number | string) {
    const data = await request(`/admin/drivers/${id}`, {
      method: "DELETE",
    });
    if (data) return { success: true };
    return { success: false, error: "API connection failed" };
  },

  // === DRIVER ENTRIES MANAGEMENT (ADMIN SIDE) ===
  async getDriverEntries(filters: { driver_id?: string; vehicle_id?: string; date?: string; start_date?: string; end_date?: string } = {}) {
    const q = new URLSearchParams();
    if (filters.driver_id) q.append("driver_id", filters.driver_id);
    if (filters.vehicle_id) q.append("vehicle_id", filters.vehicle_id);
    if (filters.date) q.append("date", filters.date);
    if (filters.start_date) q.append("start_date", filters.start_date);
    if (filters.end_date) q.append("end_date", filters.end_date);
    
    const data = await request(`/admin/driver-entries?${q.toString()}`);
    return data || [];
  },

  async createDriverEntry(entryData: any) {
    const data = await request(`/admin/driver-entries`, {
      method: "POST",
      body: JSON.stringify(entryData),
    });
    if (data) return { success: true, data };
    return { success: false, error: "API connection failed" };
  },

  async updateDriverEntry(id: number | string, entryData: any) {
    const data = await request(`/admin/driver-entries/${id}`, {
      method: "PUT",
      body: JSON.stringify(entryData),
    });
    if (data) return { success: true, data };
    return { success: false, error: "API connection failed" };
  },

  async deleteDriverEntry(id: number | string) {
    const data = await request(`/admin/driver-entries/${id}`, {
      method: "DELETE",
    });
    if (data) return { success: true };
    return { success: false, error: "API connection failed" };
  },

  async toggleDriverEntryLock(id: number | string) {
    const data = await request(`/admin/driver-entries/${id}/toggle-lock`, {
      method: "POST",
    });
    if (data) return { success: true, data };
    return { success: false, error: "API connection failed" };
  },

  // === SUB-ADMINS MANAGEMENT (ADMIN SIDE) ===
  async getSubAdmins() {
    const data = await request(`/admin/sub-admins`);
    return data || [];
  },

  async createSubAdmin(subAdminData: any) {
    const data = await request(`/admin/sub-admins`, {
      method: "POST",
      body: JSON.stringify(subAdminData),
    });
    if (data) return { success: true, data };
    return { success: false, error: "API connection failed" };
  },

  async updateSubAdmin(id: number | string, subAdminData: any) {
    const data = await request(`/admin/sub-admins/${id}`, {
      method: "PUT",
      body: JSON.stringify(subAdminData),
    });
    if (data) return { success: true, data };
    return { success: false, error: "API connection failed" };
  },

  async deleteSubAdmin(id: number | string) {
    const data = await request(`/admin/sub-admins/${id}`, {
      method: "DELETE",
    });
    if (data) return { success: true };
    return { success: false, error: "API connection failed" };
  },

  // === WEBSITE SETTINGS ===
  async getWebsiteSettings() {
    const data = await request(`/public/website-settings`);
    if (data && typeof data === "object") {
      const backendOrigin = API_BASE.replace(/\/api\/.*$/, "").replace(/\/+$/, "");
      if (typeof data.website_logo === "string" && data.website_logo.startsWith("/")) {
        data.website_logo = `${backendOrigin}${data.website_logo}`;
      }
      if (typeof data.favicon === "string" && data.favicon.startsWith("/")) {
        data.favicon = `${backendOrigin}${data.favicon}`;
      }
    }
    return data || {};
  },

  async updateWebsiteSettings(formData: FormData) {
    const data = await request(`/admin/website-settings`, {
      method: "POST",
      body: formData,
    });
    if (data) {
      const backendOrigin = API_BASE.replace(/\/api\/.*$/, "").replace(/\/+$/, "");
      if (typeof data.website_logo === "string" && data.website_logo.startsWith("/")) {
        data.website_logo = `${backendOrigin}${data.website_logo}`;
      }
      if (typeof data.favicon === "string" && data.favicon.startsWith("/")) {
        data.favicon = `${backendOrigin}${data.favicon}`;
      }
      return { success: true, data };
    }
    return { success: false, error: "API connection failed" };
  },

  async getCountryCodes() {
    return countryCodesList;
  },

  async getCustomerDocuments(customerId: string, isCompany: boolean = false) {
    const prefix = isCompany ? "/company-panel" : "";
    const data = await request(`${prefix}/customer-documents?customer_id=${customerId}`);
    return data;
  },

  async uploadCustomerDocument(formData: FormData, isCompany: boolean = false) {
    const prefix = isCompany ? "/company-panel" : "";
    const data = await request(`${prefix}/customer-documents`, {
      method: "POST",
      body: formData,
    });
    return data;
  },

  async deleteCustomerDocument(id: number, isCompany: boolean = false) {
    const prefix = isCompany ? "/company-panel" : "";
    const data = await request(`${prefix}/customer-documents/${id}`, {
      method: "DELETE",
    });
    return data;
  },

  // === GLOBAL LOCATIONS (ADMIN SIDE) ===
  async getAdminLocationsList() {
    const data = await request(`/admin/locations-list`);
    return data || [];
  },

  async createLocation(locationData: { name: string; type?: string }) {
    const data = await request(`/admin/locations-list`, {
      method: "POST",
      body: JSON.stringify(locationData),
    });
    if (data) return { success: true, data };
    return { success: false, error: "API connection failed" };
  },

  async deleteLocation(id: number | string) {
    const data = await request(`/admin/locations-list/${id}`, {
      method: "DELETE",
    });
    if (data) return { success: true };
    return { success: false, error: "API connection failed" };
  },

  // === INDIVIDUAL ORDERS ===
  async getIndividualOrders(params?: { page?: number; per_page?: number; search?: string }) {
    const q = new URLSearchParams();
    if (params?.page) q.append("page", String(params.page));
    if (params?.per_page) q.append("per_page", String(params.per_page));
    if (params?.search) q.append("search", params.search);
    const data = await request(`/admin/individual-orders?${q.toString()}`);
    return data;
  },

  async getIndividualOrder(id: string | number) {
    const data = await request(`/admin/individual-orders/${id}`);
    return data;
  },

  async updateIndividualOrderStatus(id: string | number, statusData: { status?: string; payment_status?: string }) {
    const data = await request(`/admin/individual-orders/${id}/status`, {
      method: "PUT",
      body: JSON.stringify(statusData),
    });
    if (data) return { success: true, data };
    return { success: false, error: "API connection failed" };
  },

  async createIndividualOrder(orderData: any) {
    const data = await request(`/individual-orders`, {
      method: "POST",
      body: JSON.stringify(orderData),
    });
    return data;
  },

  async getPublicInvoiceDetails(code: string) {
    const data = await request(`/individual-orders/invoice/${code}`);
    return data;
  },

  async payIndividualOrderInvoice(code: string) {
    const data = await request(`/individual-orders/pay/${code}`, {
      method: "POST",
    });
    if (data) return { success: true, data };
    return { success: false, error: "API connection failed" };
  }
};

export function getDefaultPhoneCode(userOrCompany: any): string {
  if (!userOrCompany) return "+966";
  
  const phone = userOrCompany.phone || "";
  const name = (userOrCompany.name || "").toLowerCase();
  const username = (userOrCompany.agent_username || "").toLowerCase();

  // Check phone prefix
  if (phone.startsWith("+92") || phone.startsWith("92") || phone.startsWith("0092")) return "+92";
  if (phone.startsWith("+880") || phone.startsWith("880") || phone.startsWith("00880")) return "+880";
  if (phone.startsWith("+91") || phone.startsWith("91") || phone.startsWith("0091")) return "+91";
  if (phone.startsWith("+971") || phone.startsWith("971") || phone.startsWith("00971")) return "+971";
  if (phone.startsWith("+44") || phone.startsWith("44") || phone.startsWith("0044")) return "+44";
  if (phone.startsWith("+1") || phone.startsWith("1") || phone.startsWith("001")) return "+1";
  if (phone.startsWith("+966") || phone.startsWith("966") || phone.startsWith("00966")) return "+966";

  // Check name/username keywords
  if (name.includes("pakistan") || username.includes("pakistan") || name.includes("pak") || username.includes("pak")) return "+92";
  if (name.includes("bangladesh") || username.includes("bangladesh") || name.includes("bd") || username.includes("bd")) return "+880";
  if (name.includes("india") || username.includes("india") || name.includes("ind")) return "+91";
  if (name.includes("uae") || username.includes("uae") || name.includes("dubai")) return "+971";
  if (name.includes("uk") || name.includes("london") || name.includes("britain")) return "+44";
  if (name.includes("us") || name.includes("canada") || name.includes("america")) return "+1";

  return "+966";
}


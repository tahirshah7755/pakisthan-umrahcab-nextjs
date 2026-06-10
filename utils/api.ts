// UmrahCab Central API Utility for Next.js Frontend
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/umrahcab";

// Helper to handle requests with fallback to local mock state
async function request(endpoint: string, options: RequestInit = {}) {
  try {
    let token = null;
    if (typeof window !== "undefined") {
      const isCompanyRoute = window.location.pathname.startsWith("/company") || 
                             endpoint.startsWith("/company-panel") || 
                             endpoint.startsWith("company-panel");
      if (isCompanyRoute) {
        token = sessionStorage.getItem("umrahcab_company_token") || sessionStorage.getItem("umrahcab_token");
      } else {
        token = sessionStorage.getItem("umrahcab_token") || sessionStorage.getItem("umrahcab_company_token");
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
    });
    if (!res.ok) {
      throw new Error(`HTTP Error: ${res.status}`);
    }
    const json = await res.json();
    if (json && typeof json === "object" && "status_code" in json && "data" in json) {
      return json.data;
    }
    return json;
  } catch (error) {
    console.warn(`Laravel API connection failed on ${endpoint}.`, error);
    return null;
  }
}

export const api = {
  // Bookings
  async getBookings(search?: string) {
    const data = await request(`/bookings${search ? `?search=${encodeURIComponent(search)}` : ""}`);
    return data || [];
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
    const data = await request(`/customers/${id}`);
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
  async getPriceList() {
    const data = await request(`/price-list`);
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

  async getCompanyBookings(search?: string) {
    const data = await request(`/company-panel/bookings${search ? `?search=${encodeURIComponent(search)}` : ""}`);
    return data || [];
  },

  async getCompanyCustomers(search?: string) {
    const data = await request(`/company-panel/customers${search ? `?search=${encodeURIComponent(search)}` : ""}`);
    return data || [];
  },

  async getCompanyInvoices() {
    const data = await request(`/company-panel/invoices`);
    return data || [];
  },

  async getCompanyLedgers() {
    const data = await request(`/company-panel/ledgers`);
    return data || [];
  },

  async getCompanyPayments() {
    const data = await request(`/company-panel/payments`);
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
    const data = await request(`/payments`, {
      method: "POST",
      body: isFormData ? payload : JSON.stringify(payload),
    });
    if (data) return { success: true, data };
    return { success: false, error: "API connection failed" };
  }
};

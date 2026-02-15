import axios from 'axios'

const API_BASE_URL = 'http://localhost:8000/api'

// Configuration d'axios
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Intercepteur pour ajouter le token d'authentification
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Intercepteur pour gérer les erreurs de réponse
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expiré, essayer de le rafraîchir
      const refreshToken = localStorage.getItem('refresh_token')
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
            refresh: refreshToken,
          })
          const { access } = response.data
          localStorage.setItem('access_token', access)
          
          // Retry la requête originale
          error.config.headers.Authorization = `Bearer ${access}`
          return api.request(error.config)
        } catch (refreshError) {
          // Refresh failed, redirect to login
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          localStorage.removeItem('user')
          window.location.href = '/login'
        }
      } else {
        // No refresh token, redirect to login
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('user')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// Types
export interface User {
  id: number
  email: string
  nom: string
  prenom?: string
  role: string
  actif: boolean
}

export interface Patient {
  id: number
  user: number
  user_nom: string
  user_prenom: string
  user_email: string
  nom: string
  prenom: string
  sexe: 'M' | 'F'
  age: number
  date_naissance?: string
  adresse?: string
  ville?: string
  pays?: string
  telephone?: string
  email?: string
  numero_cni?: string
  numero_cne?: string
  profession?: string
  ethnie?: string
  actif: boolean
  created_at: string
  updated_at: string
}

export interface Hopital {
  id: number
  nom: string
  code_hopital: string
  adresse: string
  ville: string
  pays: string
  telephone: string
  email: string
  latitude?: number
  longitude?: number
  logo?: string
  couleur_theme: string
  description: string
  horaires_ouverture: Record<string, string>
  admin_hopital: number
  admin_hopital_nom: string
  actif: boolean
  date_inscription: string
  created_at: string
  updated_at: string
}

export interface Specialite {
  id: number
  nom: string
  code: string
  description: string
  icone: string
  actif: boolean
  created_at: string
}

export interface Specialiste {
  id: number
  user: number
  user_nom: string
  user_email: string
  hopital: number
  hopital_nom: string
  specialite: number
  specialite_nom: string
  numero_ordre: string
  titre: string
  annees_experience: number
  bio: string
  tarif_consultation: number
  duree_consultation: number
  photo?: string
  accepte_nouveaux_patients: boolean
  consultation_en_ligne: boolean
  note_moyenne: number
  nombre_avis: number
  actif: boolean
  created_at: string
  updated_at: string
}

export interface DisponibiliteSpecialiste {
  id: number
  specialiste: number
  specialiste_nom: string
  jour_semaine: string
  heure_debut: string
  heure_fin: string
  date_debut_exception?: string
  date_fin_exception?: string
  motif_exception: string
  actif: boolean
  created_at: string
}

export interface RendezVous {
  id: number
  patient: number
  patient_nom: string
  patient_prenom: string
  patient_telephone?: string
  specialiste: number
  specialiste_nom: string
  specialiste_titre: string
  hopital: number
  hopital_nom: string
  datetime: string
  statut: 'en_attente' | 'confirme' | 'refuse' | 'annule' | 'termine'
  statut_display: string
  motif: string
  confirme_par_specialiste: boolean
  date_confirmation?: string
  date_refus?: string
  motif_refus: string
  notes: string
  created_at: string
  updated_at: string
}

export interface ConsultationPF {
  id: number
  patient: number
  patient_nom: string
  patient_prenom: string
  registre?: number
  registre_patient_nom?: string
  specialiste: number
  specialiste_nom: string
  hopital: number
  hopital_nom: string
  rendez_vous?: number
  date: string
  anamnese: string
  examen: string
  methode_posee: boolean
  effets_secondaires: string
  notes: string
  observation: string
  created_at: string
  updated_at: string
}

export interface Notification {
  id: number
  user: number
  user_nom: string
  type_notification: string
  titre: string
  message: string
  rendez_vous?: number
  commande?: number
  data: Record<string, any>
  lu: boolean
  date_lecture?: string
  created_at: string
}

export interface RapportConsultation {
  id: number
  consultation: number
  titre: string
  contenu: string
  envoye_patient: boolean
  date_envoi?: string
  created_at: string
  updated_at: string
}

export interface AvisSpecialiste {
  id: number
  patient: number
  patient_nom: string
  specialiste: number
  specialiste_nom: string
  note: number
  commentaire: string
  created_at: string
}

export interface StatistiquesHopital {
  total_specialistes: number
  specialistes_actifs: number
  total_rendez_vous: number
  rendez_vous_en_attente: number
  rendez_vous_confirmes: number
  total_consultations: number
  consultations_ce_mois: number
  par_specialite: Record<string, {
    specialistes: number
    rendez_vous: number
    consultations: number
  }>
}

export interface StatistiquesSpecialiste {
  nombre_consultations: number
  nombre_rendez_vous: number
  rendez_vous_en_attente: number
  note_moyenne: number
  nombre_avis: number
}

export interface Registre {
  id: number
  nom: string
  prenom: string
  sexe: 'M' | 'F'
  age: number
  residence: string
  ethnie: string
  profession: string
  numero_cni?: string
  numero_cne?: string
  telephone?: string
  email?: string
  consultation_nc: 'oui' | 'non'
  consultation_ac: 'oui' | 'non'
  consultation_refere_asc: 'oui' | 'non'
  poids_kg: number | string
  taille_cm: number | string
  poids_taille?: number | string | null
  taille_age?: number | string | null
  imc?: number | string | null
  motif_symptomes: string
  examen_labo_type: 'negatif' | 'positif'
  diagnostic: string
  patient?: number
  patient_nom_complet?: string
  specialiste: number
  specialiste_nom: string
  hopital: number
  hopital_nom: string
  date_creation: string
  date_modification: string
  actif: boolean
}

export interface Ordonnance {
  id: number
  registre: number
  registre_patient_nom?: string
  patient?: number
  patient_nom_complet?: string
  patient_nom: string
  patient_prenom: string
  patient_age: number
  patient_sexe: 'M' | 'F'
  specialiste: number
  specialiste_nom: string
  hopital: number
  hopital_nom: string
  numero_ordonnance: string
  date_prescription: string
  statut: 'brouillon' | 'validee' | 'delivree' | 'annulee'
  statut_display: string
  diagnostic: string
  observations?: string
  recommandations?: string
  instructions_generales?: string
  pharmacie_delivrance?: number
  pharmacie_nom?: string
  date_delivrance?: string
  notes_pharmacien?: string
  validee_par?: number
  validee_par_nom?: string
  date_validation?: string
  delivree_par?: number
  delivree_par_nom?: string
  qr_code?: string
  qr_code_url?: string
  qr_code_url_display?: string
  created_at: string
  updated_at: string
  lignes?: LigneOrdonnance[]
}

export interface LigneOrdonnance {
  id: number
  ordonnance: number
  produit?: number
  produit_nom?: string
  nom_medicament: string
  nom_complet: string
  dosage: string
  quantite: number
  unite: string
  frequence: string
  frequence_detail?: string
  moment_prise: string
  duree_traitement: number
  instructions: string
  quantite_totale?: number
  ordre: number
  created_at: string
}

export interface OrdonnanceFormData {
  registre: number
  diagnostic: string
  instructions_generales?: string
  lignes: LigneOrdonnanceFormData[]
}

export interface LigneOrdonnanceFormData {
  produit?: number
  nom_medicament: string
  dosage: string
  quantite: number
  unite: string
  frequence: string
  frequence_detail?: string
  moment_prise: string
  duree_traitement: number
  instructions?: string
  ordre?: number
}

export interface RegistreFormData {
  nom: string
  prenom: string
  sexe: 'M' | 'F'
  age: number
  residence: string
  ethnie: string
  profession: string
  numero_cni?: string
  numero_cne?: string
  telephone?: string
  email?: string
  consultation_nc: 'oui' | 'non'
  consultation_ac: 'oui' | 'non'
  consultation_refere_asc: 'oui' | 'non'
  poids_kg: number
  taille_cm: number
  motif_symptomes: string
  examen_labo_type: 'negatif' | 'positif'
  diagnostic: string
}

// Services API
export const authService = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/hospital-login/', { email, password })
    return response.data
  },
  
  logout: () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
  },
  
  getCurrentUser: (): User | null => {
    const userStr = localStorage.getItem('user')
    return userStr ? JSON.parse(userStr) : null
  },
  
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('access_token')
  },

  updateProfile: async (userData: {
    nom?: string
    email?: string
  }) => {
    const user = authService.getCurrentUser()
    if (!user) throw new Error('Utilisateur non connecté')
    
    const response = await api.patch(`/users/${user.id}/`, userData)
    
    // Mettre à jour les données utilisateur en local
    const updatedUser = { ...user, ...response.data }
    localStorage.setItem('user', JSON.stringify(updatedUser))
    
    return response.data
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await api.post('/auth/change-password/', {
      current_password: currentPassword,
      new_password: newPassword
    })
    return response.data
  },
}

export const hopitalService = {
  getAll: async () => {
    const response = await api.get('/hopitaux/')
    return response.data
  },
  
  getById: async (id: number) => {
    const response = await api.get(`/hopitaux/${id}/`)
    return response.data
  },
  
  getMyHopital: async () => {
    const response = await api.get('/hopitaux/mon_hopital/')
    return response.data
  },

  update: async (id: number, data: Partial<Hopital>) => {
    const response = await api.put(`/hopitaux/${id}/`, data)
    return response.data
  },

  getSpecialistes: async (hopitalId: number) => {
    const response = await api.get(`/hopitaux/${hopitalId}/specialistes/`)
    return response.data
  },

  getSpecialites: async (hopitalId: number) => {
    const response = await api.get(`/hopitaux/${hopitalId}/specialites/`)
    return response.data
  },

  suspendre: async (id: number) => {
    const response = await api.post(`/hopitaux/${id}/suspendre/`)
    return response.data
  },

  activer: async (id: number) => {
    const response = await api.post(`/hopitaux/${id}/activer/`)
    return response.data
  },
}

export const specialiteService = {
  getAll: async () => {
    const response = await api.get('/specialites/')
    return response.data
  },
  
  getById: async (id: number) => {
    const response = await api.get(`/specialites/${id}/`)
    return response.data
  },
}

export const specialisteService = {
  getAll: async (hopitalId?: number) => {
    const params = hopitalId ? { hopital: hopitalId } : {}
    const response = await api.get('/specialistes/', { params })
    return response.data
  },
  
  getById: async (id: number) => {
    const response = await api.get(`/specialistes/${id}/`)
    return response.data
  },

  getMe: async () => {
    const response = await api.get('/specialistes/me/')
    return response.data
  },

  updateMe: async (data: FormData | Partial<Specialiste>) => {
    const response = await api.patch('/specialistes/me/', data, {
      headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {}
    })
    return response.data
  },
  
  create: async (data: Partial<Specialiste>) => {
    const response = await api.post('/specialistes/', data)
    return response.data
  },
  
  update: async (id: number, data: Partial<Specialiste>) => {
    const response = await api.put(`/specialistes/${id}/`, data)
    return response.data
  },

  updateComplete: async (id: number, data: any) => {
    const response = await api.patch(`/specialistes/${id}/update_complete/`, data)
    return response.data
  },
  
  delete: async (id: number) => {
    await api.delete(`/specialistes/${id}/`)
  },

  getDisponibilites: async (specialisteId: number) => {
    const response = await api.get(`/specialistes/${specialisteId}/disponibilites/`)
    return response.data
  },

  getCreneauxLibres: async (specialisteId: number, date: string) => {
    const response = await api.get(`/specialistes/${specialisteId}/creneaux_libres/`, {
      params: { date }
    })
    return response.data
  },

  getAvis: async (specialisteId: number) => {
    const response = await api.get(`/specialistes/${specialisteId}/avis/`)
    return response.data
  },

  getStatistiques: async (specialisteId: number) => {
    const response = await api.get(`/specialistes/${specialisteId}/statistiques/`)
    return response.data
  },
}

export const disponibiliteService = {
  getAll: async (specialisteId?: number) => {
    const params = specialisteId ? { specialiste: specialisteId } : {}
    const response = await api.get('/disponibilites/', { params })
    return response.data
  },
  
  create: async (data: Partial<DisponibiliteSpecialiste>) => {
    const response = await api.post('/disponibilites/', data)
    return response.data
  },
  
  update: async (id: number, data: Partial<DisponibiliteSpecialiste>) => {
    const response = await api.put(`/disponibilites/${id}/`, data)
    return response.data
  },
  
  delete: async (id: number) => {
    await api.delete(`/disponibilites/${id}/`)
  },

  bulkCreate: async (disponibilites: Partial<DisponibiliteSpecialiste>[]) => {
    const response = await api.post('/disponibilites/bulk_create/', {
      disponibilites
    })
    return response.data
  },
}

export const rendezVousService = {
  getAll: async (filters?: { specialiste?: number; hopital?: number; statut?: string }) => {
    const response = await api.get('/rendez-vous/', { params: filters })
    return response.data
  },
  
  getById: async (id: number) => {
    const response = await api.get(`/rendez-vous/${id}/`)
    return response.data
  },
  
  create: async (data: Partial<RendezVous>) => {
    const response = await api.post('/rendez-vous/', data)
    return response.data
  },
  
  update: async (id: number, data: Partial<RendezVous>) => {
    const response = await api.put(`/rendez-vous/${id}/`, data)
    return response.data
  },

  confirmer: async (id: number, notes?: string) => {
    const response = await api.post(`/rendez-vous/${id}/confirmer/`, { notes })
    return response.data
  },

  refuser: async (id: number, motif: string) => {
    const response = await api.post(`/rendez-vous/${id}/refuser/`, { motif })
    return response.data
  },

  annuler: async (id: number, data: { 
    motif?: string
    reprogrammer?: boolean
    nouvelle_date?: string
    nouvelle_heure?: string
  }) => {
    const response = await api.post(`/rendez-vous/${id}/annuler/`, data)
    return response.data
  },

  terminer: async (id: number) => {
    const response = await api.post(`/rendez-vous/${id}/terminer/`)
    return response.data
  },

  getMesRendezVous: async () => {
    const response = await api.get('/rendez-vous/mes_rendez_vous/')
    return response.data
  },

  getStatistiques: async () => {
    const response = await api.get('/rendez-vous/statistiques/')
    return response.data
  },
}

export const consultationService = {
  getAll: async (filters?: { specialiste?: number; hopital?: number; patient?: number }) => {
    const response = await api.get('/consultations/', { params: filters })
    return response.data
  },
  
  getById: async (id: number) => {
    const response = await api.get(`/consultations/${id}/`)
    return response.data
  },
  
  create: async (data: Partial<ConsultationPF>) => {
    const response = await api.post('/consultations/', data)
    return response.data
  },
  
  update: async (id: number, data: Partial<ConsultationPF>) => {
    const response = await api.put(`/consultations/${id}/`, data)
    return response.data
  },

  getMesConsultations: async () => {
    const response = await api.get('/consultations/mes_consultations/')
    return response.data
  },

  getStatistiques: async () => {
    const response = await api.get('/consultations/statistiques/')
    return response.data
  },
}

export const notificationsService = {
  getAll: async (filters?: { type_notification?: string; lu?: boolean }) => {
    const params = filters || {}
    const response = await api.get('/notifications/', { params })
    return response.data
  },
  
  getById: async (id: number) => {
    const response = await api.get(`/notifications/${id}/`)
    return response.data
  },
  
  markAsRead: async (id: number) => {
    const response = await api.post(`/notifications/${id}/marquer_lu/`)
    return response.data
  },
  
  markAllAsRead: async () => {
    const response = await api.post('/notifications/marquer_toutes_lues/')
    return response.data
  },
  
  getUnreadCount: async () => {
    const response = await api.get('/notifications/non_lues/')
    return response.data
  },
  
  delete: async (id: number) => {
    await api.delete(`/notifications/${id}/`)
  },

  // Méthodes utilitaires
  getTypeConfig: (type: string) => {
    const config = {
      'rendez_vous_nouveau': { label: 'Nouveau RDV', icon: 'calendar', color: 'blue' },
      'rendez_vous_confirme': { label: 'RDV Confirmé', icon: 'check', color: 'green' },
      'rendez_vous_refuse': { label: 'RDV Refusé', icon: 'x', color: 'red' },
      'rendez_vous_rappel': { label: 'Rappel RDV', icon: 'bell', color: 'orange' },
      'consultation_rapport': { label: 'Rapport', icon: 'file-text', color: 'blue' },
      'autre': { label: 'Autre', icon: 'info', color: 'gray' }
    }
    
    return config[type as keyof typeof config] || config.autre
  }
}

export const rapportService = {
  getAll: async (consultationId?: number) => {
    const params = consultationId ? { consultation: consultationId } : {}
    const response = await api.get('/rapports-consultations/', { params })
    return response.data
  },
  
  getById: async (id: number) => {
    const response = await api.get(`/rapports-consultations/${id}/`)
    return response.data
  },
  
  create: async (data: Partial<RapportConsultation>) => {
    const response = await api.post('/rapports-consultations/', data)
    return response.data
  },
  
  update: async (id: number, data: Partial<RapportConsultation>) => {
    const response = await api.put(`/rapports-consultations/${id}/`, data)
    return response.data
  },

  envoyerPatient: async (id: number) => {
    const response = await api.post(`/rapports-consultations/${id}/envoyer_patient/`)
    return response.data
  },
}

export const avisService = {
  getAll: async (specialisteId?: number) => {
    const params = specialisteId ? { specialiste: specialisteId } : {}
    const response = await api.get('/avis-specialistes/', { params })
    return response.data
  },
  
  create: async (data: Partial<AvisSpecialiste>) => {
    const response = await api.post('/avis-specialistes/', data)
    return response.data
  },
}

export const statistiquesService = {
  getHopital: async (): Promise<StatistiquesHopital> => {
    const response = await api.get('/statistiques/')
    return response.data
  },

  getSpecialiste: async (): Promise<StatistiquesSpecialiste> => {
    const response = await api.get('/specialistes/me/statistiques/')
    return response.data
  },
}

export const registreService = {
  getAll: async (filters?: { 
    sexe?: string; 
    examen_labo_type?: string; 
    actif?: string;
    search?: string;
  }) => {
    const response = await api.get('/registres/', { params: filters })
    return response.data
  },

  getById: async (id: number): Promise<Registre> => {
    const response = await api.get(`/registres/${id}/`)
    return response.data
  },

  create: async (data: RegistreFormData): Promise<Registre> => {
    const response = await api.post('/registres/', data)
    return response.data
  },

  update: async (id: number, data: Partial<RegistreFormData>): Promise<Registre> => {
    const response = await api.put(`/registres/${id}/`, data)
    return response.data
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/registres/${id}/`)
  },

  getMesRegistres: async (): Promise<Registre[]> => {
    const response = await api.get('/registres/mes_registres/')
    return response.data
  },

  getStatistiques: async () => {
    const response = await api.get('/registres/statistiques/')
    return response.data
  },

  rechercherPatient: async (numero_cni?: string, numero_cne?: string) => {
    const params: any = {}
    if (numero_cni) params.numero_cni = numero_cni
    if (numero_cne) params.numero_cne = numero_cne
    
    const response = await api.get('/registres/rechercher_patient/', { params })
    return response.data
  },

  lierPatient: async (registreId: number, patientId: number) => {
    const response = await api.post(`/registres/${registreId}/lier_patient/`, {
      patient_id: patientId
    })
    return response.data
  },
}

export const ordonnanceService = {
  getAll: async (filters?: { 
    registre?: number; 
    specialiste?: number; 
    hopital?: number;
    statut?: string;
    search?: string;
  }) => {
    const response = await api.get('/ordonnances/', { params: filters })
    return response.data
  },

  getById: async (id: number): Promise<Ordonnance> => {
    const response = await api.get(`/ordonnances/${id}/`)
    return response.data
  },

  create: async (data: OrdonnanceFormData): Promise<Ordonnance> => {
    const response = await api.post('/ordonnances/', data)
    return response.data
  },

  update: async (id: number, data: Partial<OrdonnanceFormData>): Promise<Ordonnance> => {
    const response = await api.put(`/ordonnances/${id}/`, data)
    return response.data
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/ordonnances/${id}/`)
  },

  valider: async (id: number): Promise<Ordonnance> => {
    const response = await api.post(`/ordonnances/${id}/valider/`)
    return response.data
  },

  delivrer: async (id: number, notes?: string): Promise<Ordonnance> => {
    const response = await api.post(`/ordonnances/${id}/delivrer/`, { notes_pharmacien: notes })
    return response.data
  },

  annuler: async (id: number): Promise<Ordonnance> => {
    const response = await api.post(`/ordonnances/${id}/annuler/`)
    return response.data
  },

  getMesOrdonnances: async (): Promise<Ordonnance[]> => {
    const response = await api.get('/ordonnances/mes_ordonnances/')
    return response.data
  },

  getStatistiques: async () => {
    const response = await api.get('/ordonnances/statistiques/')
    return response.data
  },

  genererPDF: async (id: number) => {
    const response = await api.get(`/ordonnances/${id}/generer_pdf/`, {
      responseType: 'blob'
    })
    return response.data
  },

  genererQRCode: async (id: number) => {
    const response = await api.post(`/ordonnances/${id}/generer_qr_code/`)
    return response.data
  },

  telechargerPDF: async (id: number, filename?: string) => {
    try {
      const response = await api.get(`/ordonnances/${id}/generer_pdf/`, {
        responseType: 'blob'
      })
      
      // Créer un lien de téléchargement
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', filename || `ordonnance_${id}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      
      return true
    } catch (error) {
      console.error('Erreur lors du téléchargement du PDF:', error)
      return false
    }
  },
}

export const patientService = {
  getAll: async (filters?: { 
    sexe?: string; 
    actif?: string;
    search?: string;
  }) => {
    const response = await api.get('/patients/', { params: filters })
    return response.data
  },

  getById: async (id: number): Promise<Patient> => {
    const response = await api.get(`/patients/${id}/`)
    return response.data
  },

  create: async (data: Partial<Patient>): Promise<Patient> => {
    const response = await api.post('/patients/', data)
    return response.data
  },

  update: async (id: number, data: Partial<Patient>): Promise<Patient> => {
    const response = await api.put(`/patients/${id}/`, data)
    return response.data
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/patients/${id}/`)
  },

  getStatistiques: async () => {
    const response = await api.get('/patients/statistiques/')
    return response.data
  },

  getRendezVous: async (patientId: number) => {
    const response = await api.get(`/patients/${patientId}/rendez-vous/`)
    return response.data
  },

  getConsultations: async (patientId: number) => {
    const response = await api.get(`/patients/${patientId}/consultations/`)
    return response.data
  },

  getOrdonnances: async (patientId: number) => {
    const response = await api.get(`/patients/${patientId}/ordonnances/`)
    return response.data
  },
}

export default api

// Types pour DossierMedical
export interface DossierMedical {
  id: number
  numero_dossier: string
  registre: number
  registre_patient_nom?: string
  specialiste: number
  specialiste_nom: string
  hopital: number
  hopital_nom: string
  patient_nom: string
  patient_prenom: string
  patient_age: number
  patient_sexe: 'M' | 'F'
  motif_consultation: string
  histoire_maladie: string
  antecedents?: string
  antecedents_familiaux?: string
  gyneco_obstetricaux?: string
  chirurgicaux?: string
  examen_general?: string
  examen_physique?: string
  hypothese_diagnostic?: string
  diagnostic?: string
  bilan_biologie?: string
  bilan_imagerie?: string
  date_consultation: string
  created_at: string
  updated_at: string
}

export interface Produit {
  id: number
  nom: string
  code_barre?: string
  description?: string
  categorie: string
  dosage?: string
  forme?: string
  fabricant?: string
  prix_unitaire: number
  prescription_requise: boolean
  actif: boolean
  created_at: string
  updated_at: string
}

export interface DossierMedicalFormData {
  registre: number
  motif_consultation: string
  histoire_maladie: string
  antecedents?: string
  antecedents_familiaux?: string
  gyneco_obstetricaux?: string
  chirurgicaux?: string
  examen_general?: string
  examen_physique?: string
  hypothese_diagnostic?: string
  diagnostic?: string
  bilan_biologie?: string
  bilan_imagerie?: string
}

// Types pour FichierDossierMedical
export interface FichierDossierMedical {
  id: number
  dossier_medical: number
  type_fichier: string
  type_fichier_display: string
  fichier: string
  fichier_url: string
  nom_fichier: string
  description?: string
  taille_fichier?: number
  taille_fichier_display?: string
  type_mime?: string
  created_at: string
  updated_at: string
}

export interface DossierMedicalDetail extends DossierMedical {
  fichiers: FichierDossierMedical[]
  fichiers_par_type: Record<string, FichierDossierMedical[]>
}

// Service pour DossierMedical
export const dossierMedicalService = {
  getAll: async (params?: any) => {
    const response = await api.get('/dossiers-medicaux/', { params })
    return response.data
  },
  
  getById: async (id: number): Promise<DossierMedicalDetail> => {
    const response = await api.get(`/dossiers-medicaux/${id}/`)
    return response.data
  },
  
  create: async (data: DossierMedicalFormData) => {
    const response = await api.post('/dossiers-medicaux/', data)
    return response.data
  },
  
  update: async (id: number, data: Partial<DossierMedicalFormData>) => {
    const response = await api.put(`/dossiers-medicaux/${id}/`, data)
    return response.data
  },
  
  delete: async (id: number) => {
    await api.delete(`/dossiers-medicaux/${id}/`)
  },
  
  mesDossiers: async () => {
    const response = await api.get('/dossiers-medicaux/mes_dossiers/')
    return response.data
  },
  
  exportPDF: async (id: number) => {
    const response = await api.get(`/dossiers-medicaux/${id}/export_pdf/`)
    return response.data
  },

  uploadFichier: async (id: number, formData: FormData) => {
    const response = await api.post(`/dossiers-medicaux/${id}/upload_fichier/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  }
}

// Service pour FichierDossierMedical
export const fichierDossierMedicalService = {
  getAll: async (params?: { dossier_medical?: number; type_fichier?: string }) => {
    const response = await api.get('/fichiers-dossiers-medicaux/', { params })
    return response.data
  },

  getById: async (id: number): Promise<FichierDossierMedical> => {
    const response = await api.get(`/fichiers-dossiers-medicaux/${id}/`)
    return response.data
  },

  create: async (formData: FormData): Promise<FichierDossierMedical> => {
    const response = await api.post('/fichiers-dossiers-medicaux/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/fichiers-dossiers-medicaux/${id}/`)
  },

  download: async (id: number, filename?: string) => {
    try {
      const response = await api.get(`/fichiers-dossiers-medicaux/${id}/download/`, {
        responseType: 'blob'
      })
      
      // Créer un lien de téléchargement
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', filename || `fichier_${id}`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      
      return true
    } catch (error) {
      console.error('Erreur lors du téléchargement du fichier:', error)
      return false
    }
  }
}

// Service pour Produit
export const produitService = {
  getAll: async (params?: { 
    categorie?: string
    prescription_requise?: boolean
    actif?: boolean
    search?: string
  }) => {
    const response = await api.get('/produits/', { params })
    return response.data
  },
  
  getById: async (id: number) => {
    const response = await api.get(`/produits/${id}/`)
    return response.data
  },
  
  recherche: async (query: string, categorie?: string) => {
    const response = await api.get('/produits/recherche/', { 
      params: { q: query, categorie } 
    })
    return response.data
  },
}
import React, { useState, useEffect } from 'react';
import { Plus, Search, Eye, Edit, Trash2, UserPlus, FileText, Pill } from 'lucide-react';
import { registreService, authService, type Registre, type RegistreFormData } from '../services/api';

interface PatientExistant {
  id: number;
  nom: string;
  prenom: string;
  sexe: 'M' | 'F';
  age: number;
  telephone?: string;
  email?: string;
  numero_cni?: string;
  numero_cne?: string;
}

const Registres: React.FC = () => {
  const [registres, setRegistres] = useState<Registre[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRegistre, setSelectedRegistre] = useState<Registre | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [patientExistant, setPatientExistant] = useState<PatientExistant | null>(null);
  const [recherchePatient, setRecherchePatient] = useState(false);
  const [filters, setFilters] = useState({
    sexe: '',
    examen_labo_type: '',
    actif: 'true'
  });

  // Fonction utilitaire pour convertir en nombre
  const toNumber = (value: number | string | null | undefined): number | null => {
    if (value === null || value === undefined) return null;
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(num) ? null : num;
  };

  const [formData, setFormData] = useState<RegistreFormData>({
    nom: '',
    prenom: '',
    sexe: 'M',
    age: 0,
    residence: '',
    ethnie: '',
    profession: '',
    numero_cni: '',
    numero_cne: '',
    telephone: '',
    email: '',
    consultation_nc: 'non',
    consultation_ac: 'non',
    consultation_refere_asc: 'non',
    poids_kg: 0,
    taille_cm: 0,
    motif_symptomes: '',
    examen_labo_type: 'negatif',
    diagnostic: ''
  });

  useEffect(() => {
    // Vérifier l'authentification
    if (!authService.isAuthenticated()) {
      window.location.href = '/login';
      return;
    }
    
    fetchRegistres();
  }, [filters]);

  const fetchRegistres = async () => {
    try {
      setLoading(true);
      const response = await registreService.getAll({
        sexe: filters.sexe || undefined,
        examen_labo_type: filters.examen_labo_type || undefined,
        actif: filters.actif || undefined,
        search: searchTerm || undefined
      });
      setRegistres(response.results || response);
    } catch (error: any) {
      console.error('Erreur lors du chargement des registres:', error);
      
      // Si erreur 401, rediriger vers login
      if (error.response?.status === 401) {
        alert('Session expirée. Veuillez vous reconnecter.');
        window.location.href = '/login';
        return;
      }
      
      // Autres erreurs
      alert('Erreur lors du chargement des registres. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const rechercherPatientExistant = async (numero: string, type: 'cni' | 'cne') => {
    if (!numero.trim()) {
      setPatientExistant(null);
      return;
    }
    
    try {
      setRecherchePatient(true);
      const response = await registreService.rechercherPatient(
        type === 'cni' ? numero : undefined,
        type === 'cne' ? numero : undefined
      );
      
      if (response.trouve) {
        setPatientExistant(response.patient);
        // Pré-remplir le formulaire avec les données du patient
        const patient = response.patient;
        setFormData(prev => ({
          ...prev,
          nom: patient.nom,
          prenom: patient.prenom,
          sexe: patient.sexe,
          age: patient.age,
          telephone: patient.telephone || '',
          email: patient.email || '',
          numero_cni: patient.numero_cni || '',
          numero_cne: patient.numero_cne || '',
          // Si on a des infos supplémentaires du patient, les utiliser
          residence: patient.adresse || prev.residence,
          profession: patient.profession || prev.profession,
          ethnie: patient.ethnie || prev.ethnie
        }));
      } else {
        setPatientExistant(null);
        // Garder le numéro saisi mais réinitialiser les autres champs si pas de patient trouvé
        if (type === 'cni') {
          setFormData(prev => ({ ...prev, numero_cni: numero }));
        } else {
          setFormData(prev => ({ ...prev, numero_cne: numero }));
        }
      }
    } catch (error) {
      console.error('Erreur lors de la recherche du patient:', error);
      setPatientExistant(null);
    } finally {
      setRecherchePatient(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation côté client
    if (!formData.numero_cni?.trim() && !formData.numero_cne?.trim()) {
      alert('Au moins un numéro d\'identité (CNI ou CNE) est requis.');
      return;
    }
    
    try {
      // Nettoyer les données avant envoi
      const cleanedData = {
        ...formData,
        numero_cni: formData.numero_cni?.trim() || undefined,
        numero_cne: formData.numero_cne?.trim() || undefined,
        telephone: formData.telephone?.trim() || undefined,
        email: formData.email?.trim() || undefined
      };
      
      if (isEditing && selectedRegistre) {
        await registreService.update(selectedRegistre.id, cleanedData);
      } else {
        await registreService.create(cleanedData);
      }
      
      fetchRegistres();
      resetForm();
      setShowModal(false);
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde:', error);
      
      // Afficher l'erreur à l'utilisateur
      if (error.response?.data?.non_field_errors) {
        alert(error.response.data.non_field_errors.join('\n'));
      } else if (error.response?.data) {
        const errors = Object.entries(error.response.data)
          .map(([field, messages]: [string, any]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
          .join('\n');
        alert(`Erreurs de validation:\n${errors}`);
      } else {
        alert('Une erreur est survenue lors de la sauvegarde.');
      }
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce registre ?')) {
      try {
        await registreService.delete(id);
        fetchRegistres();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      nom: '',
      prenom: '',
      sexe: 'M',
      age: 0,
      residence: '',
      ethnie: '',
      profession: '',
      numero_cni: '',
      numero_cne: '',
      telephone: '',
      email: '',
      consultation_nc: 'non',
      consultation_ac: 'non',
      consultation_refere_asc: 'non',
      poids_kg: 0,
      taille_cm: 0,
      motif_symptomes: '',
      examen_labo_type: 'negatif',
      diagnostic: ''
    });
    setIsEditing(false);
    setSelectedRegistre(null);
    setPatientExistant(null);
  };

  const openEditModal = (registre: Registre) => {
    setSelectedRegistre(registre);
    setFormData({
      nom: registre.nom,
      prenom: registre.prenom,
      sexe: registre.sexe,
      age: registre.age,
      residence: registre.residence,
      ethnie: registre.ethnie,
      profession: registre.profession,
      numero_cni: registre.numero_cni || '',
      numero_cne: registre.numero_cne || '',
      telephone: registre.telephone || '',
      email: registre.email || '',
      consultation_nc: registre.consultation_nc,
      consultation_ac: registre.consultation_ac,
      consultation_refere_asc: registre.consultation_refere_asc,
      poids_kg: toNumber(registre.poids_kg) || 0,
      taille_cm: toNumber(registre.taille_cm) || 0,
      motif_symptomes: registre.motif_symptomes,
      examen_labo_type: registre.examen_labo_type,
      diagnostic: registre.diagnostic
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const openDetailModal = (registre: Registre) => {
    setSelectedRegistre(registre);
    setShowDetailModal(true);
  };

  const filteredRegistres = registres.filter(registre =>
    registre.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    registre.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    registre.diagnostic.toLowerCase().includes(searchTerm.toLowerCase()) ||
    registre.motif_symptomes.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Registres</h1>
          <p className="text-gray-600">Gestion des registres hospitaliers</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Nouveau Registre
        </button>
      </div>

      {/* Filtres et recherche */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={filters.sexe}
            onChange={(e) => setFilters(prev => ({ ...prev, sexe: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Tous les sexes</option>
            <option value="M">Masculin</option>
            <option value="F">Féminin</option>
          </select>

          <select
            value={filters.examen_labo_type}
            onChange={(e) => setFilters(prev => ({ ...prev, examen_labo_type: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Tous les examens</option>
            <option value="positif">Positif</option>
            <option value="negatif">Négatif</option>
          </select>

          <select
            value={filters.actif}
            onChange={(e) => setFilters(prev => ({ ...prev, actif: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="true">Actifs</option>
            <option value="false">Inactifs</option>
            <option value="">Tous</option>
          </select>
        </div>
      </div>

      {/* Liste des registres */}
      <div className="bg-white rounded-lg shadow-sm">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Chargement...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Âge/Sexe
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Motif
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Examen Labo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Spécialiste
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRegistres.map((registre) => (
                  <tr key={registre.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {registre.nom} {registre.prenom}
                        </div>
                        {registre.patient_nom_complet && (
                          <div className="text-sm text-green-600">
                            Lié: {registre.patient_nom_complet}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {registre.age} ans • {registre.sexe === 'M' ? 'Masculin' : 'Féminin'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {registre.motif_symptomes}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        registre.examen_labo_type === 'positif' 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {registre.examen_labo_type === 'positif' ? 'Positif' : 'Négatif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {registre.specialiste_nom}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(registre.date_creation).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openDetailModal(registre)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Voir détails"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(registre)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Modifier"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => window.location.href = `/ordonnances?registre=${registre.id}`}
                          className="text-green-600 hover:text-green-900"
                          title="Ordonnance"
                        >
                          <Pill className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => alert('Dossier médical - Fonctionnalité à venir')}
                          className="text-purple-600 hover:text-purple-900"
                          title="Dossier médical"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(registre.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredRegistres.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                Aucun registre trouvé
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de création/modification */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {isEditing ? 'Modifier le registre' : 'Nouveau registre'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Recherche de patient existant */}
                {!isEditing && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-blue-900 mb-3">
                      Rechercher un patient existant (requis)
                    </h3>
                    <p className="text-xs text-blue-700 mb-3">
                      Au moins un numéro d'identité (CNI ou CNE) est obligatoire. Si le patient existe, ses informations seront automatiquement remplies.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Numéro CNI *
                        </label>
                        <div className="flex">
                          <input
                            type="text"
                            value={formData.numero_cni}
                            onChange={(e) => {
                              const value = e.target.value;
                              setFormData(prev => ({ ...prev, numero_cni: value }));
                              // Recherche automatique après 3 caractères
                              if (value.length >= 3) {
                                rechercherPatientExistant(value, 'cni');
                              } else if (value.length === 0) {
                                setPatientExistant(null);
                              }
                            }}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Entrez le numéro CNI"
                          />
                          <button
                            type="button"
                            onClick={() => rechercherPatientExistant(formData.numero_cni || '', 'cni')}
                            disabled={recherchePatient || !formData.numero_cni}
                            className="px-4 py-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 disabled:opacity-50"
                          >
                            {recherchePatient ? '...' : 'Rechercher'}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Numéro CNE *
                        </label>
                        <div className="flex">
                          <input
                            type="text"
                            value={formData.numero_cne}
                            onChange={(e) => {
                              const value = e.target.value;
                              setFormData(prev => ({ ...prev, numero_cne: value }));
                              // Recherche automatique après 3 caractères
                              if (value.length >= 3) {
                                rechercherPatientExistant(value, 'cne');
                              } else if (value.length === 0) {
                                setPatientExistant(null);
                              }
                            }}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Entrez le numéro CNE"
                          />
                          <button
                            type="button"
                            onClick={() => rechercherPatientExistant(formData.numero_cne || '', 'cne')}
                            disabled={recherchePatient || !formData.numero_cne}
                            className="px-4 py-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 disabled:opacity-50"
                          >
                            {recherchePatient ? '...' : 'Rechercher'}
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {patientExistant && (
                      <div className="mt-3 p-3 bg-green-100 rounded-lg">
                        <div className="flex items-center gap-2">
                          <UserPlus className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium text-green-800">
                            Patient trouvé: {patientExistant.nom} {patientExistant.prenom}
                          </span>
                        </div>
                        <p className="text-xs text-green-700 mt-1">
                          Les informations du patient ont été pré-remplies. Le registre sera automatiquement lié à ce patient.
                        </p>
                      </div>
                    )}
                    
                    {!patientExistant && (formData.numero_cni || formData.numero_cne) && (
                      <div className="mt-3 p-3 bg-yellow-100 rounded-lg">
                        <div className="flex items-center gap-2">
                          <UserPlus className="w-4 h-4 text-yellow-600" />
                          <span className="text-sm font-medium text-yellow-800">
                            Nouveau patient
                          </span>
                        </div>
                        <p className="text-xs text-yellow-700 mt-1">
                          Aucun patient trouvé avec ce numéro. Un nouveau compte patient sera créé automatiquement.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Informations du patient */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Informations du patient</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nom *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.nom}
                        onChange={(e) => setFormData(prev => ({ ...prev, nom: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Prénom *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.prenom}
                        onChange={(e) => setFormData(prev => ({ ...prev, prenom: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Sexe *
                      </label>
                      <select
                        required
                        value={formData.sexe}
                        onChange={(e) => setFormData(prev => ({ ...prev, sexe: e.target.value as 'M' | 'F' }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="M">Masculin</option>
                        <option value="F">Féminin</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Âge *
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        max="150"
                        value={formData.age}
                        onChange={(e) => setFormData(prev => ({ ...prev, age: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Résidence *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.residence}
                        onChange={(e) => setFormData(prev => ({ ...prev, residence: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ethnie *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.ethnie}
                        onChange={(e) => setFormData(prev => ({ ...prev, ethnie: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Profession *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.profession}
                        onChange={(e) => setFormData(prev => ({ ...prev, profession: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Téléphone
                      </label>
                      <input
                        type="tel"
                        value={formData.telephone}
                        onChange={(e) => setFormData(prev => ({ ...prev, telephone: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  {/* Numéros d'identité */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Numéro CNI {!isEditing && '*'}
                      </label>
                      <input
                        type="text"
                        value={formData.numero_cni}
                        onChange={(e) => setFormData(prev => ({ ...prev, numero_cni: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        readOnly={isEditing}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Numéro CNE {!isEditing && '*'}
                      </label>
                      <input
                        type="text"
                        value={formData.numero_cne}
                        onChange={(e) => setFormData(prev => ({ ...prev, numero_cne: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        readOnly={isEditing}
                      />
                    </div>
                  </div>
                  {!isEditing && (
                    <p className="text-xs text-gray-500 mt-1">
                      * Au moins un numéro d'identité (CNI ou CNE) est requis
                    </p>
                  )}
                </div>

                {/* Consultation */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Consultation</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        NC *
                      </label>
                      <select
                        required
                        value={formData.consultation_nc}
                        onChange={(e) => setFormData(prev => ({ ...prev, consultation_nc: e.target.value as 'oui' | 'non' }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="non">Non</option>
                        <option value="oui">Oui</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        AC *
                      </label>
                      <select
                        required
                        value={formData.consultation_ac}
                        onChange={(e) => setFormData(prev => ({ ...prev, consultation_ac: e.target.value as 'oui' | 'non' }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="non">Non</option>
                        <option value="oui">Oui</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        REFERE ASC *
                      </label>
                      <select
                        required
                        value={formData.consultation_refere_asc}
                        onChange={(e) => setFormData(prev => ({ ...prev, consultation_refere_asc: e.target.value as 'oui' | 'non' }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="non">Non</option>
                        <option value="oui">Oui</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Mesures physiques */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Mesures physiques</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Poids (kg) *
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.1"
                        value={formData.poids_kg}
                        onChange={(e) => setFormData(prev => ({ ...prev, poids_kg: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Taille (cm) *
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.1"
                        value={formData.taille_cm}
                        onChange={(e) => setFormData(prev => ({ ...prev, taille_cm: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  {formData.poids_kg > 0 && formData.taille_cm > 0 && (
                    <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">
                        IMC calculé: {((formData.poids_kg / Math.pow(formData.taille_cm / 100, 2))).toFixed(1)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Motif et diagnostic */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Motif et diagnostic</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Motif ou symptômes *
                      </label>
                      <textarea
                        required
                        rows={3}
                        value={formData.motif_symptomes}
                        onChange={(e) => setFormData(prev => ({ ...prev, motif_symptomes: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Décrivez les symptômes ou le motif de consultation..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Type d'examen laboratoire *
                      </label>
                      <select
                        required
                        value={formData.examen_labo_type}
                        onChange={(e) => setFormData(prev => ({ ...prev, examen_labo_type: e.target.value as 'negatif' | 'positif' }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="negatif">Négatif</option>
                        <option value="positif">Positif</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Diagnostic *
                      </label>
                      <textarea
                        required
                        rows={4}
                        value={formData.diagnostic}
                        onChange={(e) => setFormData(prev => ({ ...prev, diagnostic: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Saisissez le diagnostic..."
                      />
                    </div>
                  </div>
                </div>

                {/* Boutons */}
                <div className="flex justify-end space-x-4 pt-6 border-t">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {isEditing ? 'Mettre à jour' : 'Créer le registre'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de détails */}
      {showDetailModal && selectedRegistre && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Détails du registre
                </h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                {/* Informations du patient */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Informations du patient</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div>
                      <span className="text-sm font-medium text-gray-500">Nom complet:</span>
                      <p className="text-sm text-gray-900">{selectedRegistre.nom} {selectedRegistre.prenom}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Âge/Sexe:</span>
                      <p className="text-sm text-gray-900">{selectedRegistre.age} ans • {selectedRegistre.sexe === 'M' ? 'Masculin' : 'Féminin'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Résidence:</span>
                      <p className="text-sm text-gray-900">{selectedRegistre.residence}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Ethnie:</span>
                      <p className="text-sm text-gray-900">{selectedRegistre.ethnie}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Profession:</span>
                      <p className="text-sm text-gray-900">{selectedRegistre.profession}</p>
                    </div>
                    {selectedRegistre.telephone && (
                      <div>
                        <span className="text-sm font-medium text-gray-500">Téléphone:</span>
                        <p className="text-sm text-gray-900">{selectedRegistre.telephone}</p>
                      </div>
                    )}
                    {selectedRegistre.numero_cni && (
                      <div>
                        <span className="text-sm font-medium text-gray-500">CNI:</span>
                        <p className="text-sm text-gray-900">{selectedRegistre.numero_cni}</p>
                      </div>
                    )}
                    {selectedRegistre.numero_cne && (
                      <div>
                        <span className="text-sm font-medium text-gray-500">CNE:</span>
                        <p className="text-sm text-gray-900">{selectedRegistre.numero_cne}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Consultation */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Consultation</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div>
                      <span className="text-sm font-medium text-gray-500">NC:</span>
                      <p className="text-sm text-gray-900">{selectedRegistre.consultation_nc === 'oui' ? 'Oui' : 'Non'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">AC:</span>
                      <p className="text-sm text-gray-900">{selectedRegistre.consultation_ac === 'oui' ? 'Oui' : 'Non'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">REFERE ASC:</span>
                      <p className="text-sm text-gray-900">{selectedRegistre.consultation_refere_asc === 'oui' ? 'Oui' : 'Non'}</p>
                    </div>
                  </div>
                </div>

                {/* Mesures physiques */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Mesures physiques</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div>
                      <span className="text-sm font-medium text-gray-500">Poids:</span>
                      <p className="text-sm text-gray-900">{selectedRegistre.poids_kg} kg</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Taille:</span>
                      <p className="text-sm text-gray-900">{selectedRegistre.taille_cm} cm</p>
                    </div>
                    {toNumber(selectedRegistre.imc) && (
                      <div>
                        <span className="text-sm font-medium text-gray-500">IMC:</span>
                        <p className="text-sm text-gray-900">{toNumber(selectedRegistre.imc)!.toFixed(1)}</p>
                      </div>
                    )}
                    {toNumber(selectedRegistre.poids_taille) && (
                      <div>
                        <span className="text-sm font-medium text-gray-500">Poids/Taille:</span>
                        <p className="text-sm text-gray-900">{toNumber(selectedRegistre.poids_taille)!.toFixed(2)}</p>
                      </div>
                    )}
                    {toNumber(selectedRegistre.taille_age) && (
                      <div>
                        <span className="text-sm font-medium text-gray-500">Taille/Âge:</span>
                        <p className="text-sm text-gray-900">{toNumber(selectedRegistre.taille_age)!.toFixed(2)}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Motif et diagnostic */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Motif et diagnostic</h3>
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <span className="text-sm font-medium text-gray-500">Motif ou symptômes:</span>
                      <p className="text-sm text-gray-900 mt-1">{selectedRegistre.motif_symptomes}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <span className="text-sm font-medium text-gray-500">Examen laboratoire:</span>
                      <p className="text-sm text-gray-900 mt-1">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          selectedRegistre.examen_labo_type === 'positif' 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {selectedRegistre.examen_labo_type === 'positif' ? 'Positif' : 'Négatif'}
                        </span>
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <span className="text-sm font-medium text-gray-500">Diagnostic:</span>
                      <p className="text-sm text-gray-900 mt-1">{selectedRegistre.diagnostic}</p>
                    </div>
                  </div>
                </div>

                {/* Informations système */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Informations système</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                    <div>
                      <span className="text-sm font-medium text-gray-500">Spécialiste:</span>
                      <p className="text-sm text-gray-900">{selectedRegistre.specialiste_nom}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Hôpital:</span>
                      <p className="text-sm text-gray-900">{selectedRegistre.hopital_nom}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Date de création:</span>
                      <p className="text-sm text-gray-900">{new Date(selectedRegistre.date_creation).toLocaleString('fr-FR')}</p>
                    </div>
                    {selectedRegistre.patient_nom_complet && (
                      <div>
                        <span className="text-sm font-medium text-gray-500">Patient lié:</span>
                        <p className="text-sm text-green-600">{selectedRegistre.patient_nom_complet}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-6 border-t">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Registres;
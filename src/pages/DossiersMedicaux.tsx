import React, { useState, useEffect } from 'react';
import { Plus, Search, Eye, Edit, Trash2, ArrowLeft, Download } from 'lucide-react';
import { dossierMedicalService, registreService, authService, type DossierMedical, type DossierMedicalFormData, type Registre } from '../services/api';

const DossiersMedicaux: React.FC = () => {
  const [dossiers, setDossiers] = useState<DossierMedical[]>([]);
  const [registres, setRegistres] = useState<Registre[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDossier, setSelectedDossier] = useState<DossierMedical | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [filters, setFilters] = useState({
    registre: ''
  });

  // Récupérer le registre depuis l'URL si présent
  const urlParams = new URLSearchParams(window.location.search);
  const registreIdFromUrl = urlParams.get('registre');

  const [formData, setFormData] = useState<DossierMedicalFormData>({
    registre: registreIdFromUrl ? parseInt(registreIdFromUrl) : 0,
    motif_consultation: '',
    histoire_maladie: '',
    antecedents: '',
    antecedents_familiaux: '',
    gyneco_obstetricaux: '',
    chirurgicaux: '',
    examen_general: '',
    examen_physique: '',
    hypothese_diagnostic: '',
    diagnostic: '',
    bilan_biologie: '',
    bilan_imagerie: ''
  });

  useEffect(() => {
    // Vérifier l'authentification
    if (!authService.isAuthenticated()) {
      window.location.href = '/login';
      return;
    }
    
    fetchDossiers();
    fetchRegistres();
  }, [filters]);

  const fetchDossiers = async () => {
    try {
      setLoading(true);
      const response = await dossierMedicalService.getAll({
        registre: filters.registre ? parseInt(filters.registre) : undefined,
        search: searchTerm || undefined
      });
      setDossiers(response.results || response);
    } catch (error: any) {
      console.error('Erreur lors du chargement des dossiers médicaux:', error);
      
      if (error.response?.status === 401) {
        alert('Session expirée. Veuillez vous reconnecter.');
        window.location.href = '/login';
        return;
      }
      
      alert('Erreur lors du chargement des dossiers médicaux. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const fetchRegistres = async () => {
    try {
      const response = await registreService.getAll();
      setRegistres(response.results || response);
    } catch (error) {
      console.error('Erreur lors du chargement des registres:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (isEditing && selectedDossier) {
        await dossierMedicalService.update(selectedDossier.id, formData);
      } else {
        await dossierMedicalService.create(formData);
      }
      
      fetchDossiers();
      resetForm();
      setShowModal(false);
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde:', error);
      
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
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce dossier médical ?')) {
      try {
        await dossierMedicalService.delete(id);
        fetchDossiers();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression du dossier médical.');
      }
    }
  };

  const handleExportPDF = async (dossier: DossierMedical) => {
    try {
      await dossierMedicalService.exportPDF(dossier.id);
      alert('Export PDF en cours de développement.');
    } catch (error) {
      console.error('Erreur lors de l\'export PDF:', error);
      alert('Erreur lors de l\'export PDF.');
    }
  };

  const resetForm = () => {
    setFormData({
      registre: registreIdFromUrl ? parseInt(registreIdFromUrl) : 0,
      motif_consultation: '',
      histoire_maladie: '',
      antecedents: '',
      antecedents_familiaux: '',
      gyneco_obstetricaux: '',
      chirurgicaux: '',
      examen_general: '',
      examen_physique: '',
      hypothese_diagnostic: '',
      diagnostic: '',
      bilan_biologie: '',
      bilan_imagerie: ''
    });
    setIsEditing(false);
    setSelectedDossier(null);
  };

  const openEditModal = (dossier: DossierMedical) => {
    setSelectedDossier(dossier);
    setFormData({
      registre: dossier.registre,
      motif_consultation: dossier.motif_consultation,
      histoire_maladie: dossier.histoire_maladie,
      antecedents: dossier.antecedents || '',
      antecedents_familiaux: dossier.antecedents_familiaux || '',
      gyneco_obstetricaux: dossier.gyneco_obstetricaux || '',
      chirurgicaux: dossier.chirurgicaux || '',
      examen_general: dossier.examen_general || '',
      examen_physique: dossier.examen_physique || '',
      hypothese_diagnostic: dossier.hypothese_diagnostic || '',
      diagnostic: dossier.diagnostic || '',
      bilan_biologie: dossier.bilan_biologie || '',
      bilan_imagerie: dossier.bilan_imagerie || ''
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const openDetailModal = (dossier: DossierMedical) => {
    setSelectedDossier(dossier);
    setShowDetailModal(true);
  };

  const filteredDossiers = dossiers.filter(dossier =>
    dossier.numero_dossier.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (dossier.registre_patient_nom && dossier.registre_patient_nom.toLowerCase().includes(searchTerm.toLowerCase())) ||
    dossier.patient_nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dossier.patient_prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dossier.specialiste_nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dossier.motif_consultation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          {registreIdFromUrl && (
            <button
              onClick={() => window.history.back()}
              className="text-gray-600 hover:text-gray-800"
              title="Retour"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dossiers Médicaux</h1>
            <p className="text-gray-600">Gestion des dossiers médicaux des patients</p>
          </div>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Nouveau Dossier
        </button>
      </div>

      {/* Filtres et recherche */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            value={filters.registre}
            onChange={(e) => setFilters(prev => ({ ...prev, registre: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Tous les registres</option>
            {registres.map(registre => (
              <option key={registre.id} value={registre.id}>
                {registre.nom} {registre.prenom}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Liste des dossiers */}
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
                    N° Dossier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Spécialiste
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Motif
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
                {filteredDossiers.map((dossier) => (
                  <tr key={dossier.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {dossier.numero_dossier}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {dossier.registre_patient_nom || `${dossier.patient_nom} ${dossier.patient_prenom}`}
                      </div>
                      <div className="text-sm text-gray-500">
                        {dossier.patient_age} ans • {dossier.patient_sexe === 'M' ? 'Masculin' : 'Féminin'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {dossier.specialiste_nom}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {dossier.motif_consultation}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(dossier.date_consultation).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openDetailModal(dossier)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Voir détails"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(dossier)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Modifier"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleExportPDF(dossier)}
                          className="text-purple-600 hover:text-purple-900"
                          title="Exporter PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(dossier.id)}
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
            
            {filteredDossiers.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                Aucun dossier médical trouvé
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
                  {isEditing ? 'Modifier le dossier médical' : 'Nouveau dossier médical'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Sélection du registre */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Registre patient *
                  </label>
                  <select
                    required
                    value={formData.registre}
                    onChange={(e) => setFormData(prev => ({ ...prev, registre: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={!!registreIdFromUrl}
                  >
                    <option value={0}>Sélectionner un registre</option>
                    {registres.map(registre => (
                      <option key={registre.id} value={registre.id}>
                        {registre.nom} {registre.prenom} - {registre.diagnostic}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Consultation */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Motif de consultation *
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={formData.motif_consultation}
                      onChange={(e) => setFormData(prev => ({ ...prev, motif_consultation: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Motif de la consultation..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Histoire de la maladie *
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={formData.histoire_maladie}
                      onChange={(e) => setFormData(prev => ({ ...prev, histoire_maladie: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Histoire de la maladie..."
                    />
                  </div>
                </div>

                {/* Antécédents */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Antécédents</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Antécédents
                      </label>
                      <textarea
                        rows={3}
                        value={formData.antecedents}
                        onChange={(e) => setFormData(prev => ({ ...prev, antecedents: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Antécédents médicaux..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Antécédents familiaux
                      </label>
                      <textarea
                        rows={3}
                        value={formData.antecedents_familiaux}
                        onChange={(e) => setFormData(prev => ({ ...prev, antecedents_familiaux: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Antécédents familiaux..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Gynéco-Obstétricaux
                      </label>
                      <textarea
                        rows={3}
                        value={formData.gyneco_obstetricaux}
                        onChange={(e) => setFormData(prev => ({ ...prev, gyneco_obstetricaux: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Antécédents gynéco-obstétricaux..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Chirurgicaux
                      </label>
                      <textarea
                        rows={3}
                        value={formData.chirurgicaux}
                        onChange={(e) => setFormData(prev => ({ ...prev, chirurgicaux: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Antécédents chirurgicaux..."
                      />
                    </div>
                  </div>
                </div>

                {/* Examens */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Examens</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Examen général
                      </label>
                      <textarea
                        rows={3}
                        value={formData.examen_general}
                        onChange={(e) => setFormData(prev => ({ ...prev, examen_general: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Examen général..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Examen physique
                      </label>
                      <textarea
                        rows={3}
                        value={formData.examen_physique}
                        onChange={(e) => setFormData(prev => ({ ...prev, examen_physique: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Examen physique..."
                      />
                    </div>
                  </div>
                </div>

                {/* Diagnostic */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Diagnostic</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Hypothèse diagnostic
                      </label>
                      <textarea
                        rows={3}
                        value={formData.hypothese_diagnostic}
                        onChange={(e) => setFormData(prev => ({ ...prev, hypothese_diagnostic: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Hypothèse diagnostic..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Diagnostic
                      </label>
                      <textarea
                        rows={3}
                        value={formData.diagnostic}
                        onChange={(e) => setFormData(prev => ({ ...prev, diagnostic: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Diagnostic final..."
                      />
                    </div>
                  </div>
                </div>

                {/* Bilan */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Bilan</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Biologie
                      </label>
                      <textarea
                        rows={3}
                        value={formData.bilan_biologie}
                        onChange={(e) => setFormData(prev => ({ ...prev, bilan_biologie: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Bilan biologique..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Imagerie
                      </label>
                      <textarea
                        rows={3}
                        value={formData.bilan_imagerie}
                        onChange={(e) => setFormData(prev => ({ ...prev, bilan_imagerie: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Bilan d'imagerie..."
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
                    {isEditing ? 'Mettre à jour' : 'Créer le dossier'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de détails */}
      {showDetailModal && selectedDossier && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Détails du dossier médical
                </h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                {/* Informations générales */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <span className="text-sm font-medium text-gray-500">N° Dossier:</span>
                    <p className="text-sm text-gray-900">{selectedDossier.numero_dossier}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Patient:</span>
                    <p className="text-sm text-gray-900">
                      {selectedDossier.registre_patient_nom || 
                       `${selectedDossier.patient_nom} ${selectedDossier.patient_prenom}`}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Spécialiste:</span>
                    <p className="text-sm text-gray-900">{selectedDossier.specialiste_nom}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Date de consultation:</span>
                    <p className="text-sm text-gray-900">{new Date(selectedDossier.date_consultation).toLocaleDateString('fr-FR')}</p>
                  </div>
                </div>

                {/* Consultation */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Consultation</h3>
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-700 mb-2">Motif de consultation</h4>
                      <p className="text-sm text-gray-900">{selectedDossier.motif_consultation}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-700 mb-2">Histoire de la maladie</h4>
                      <p className="text-sm text-gray-900">{selectedDossier.histoire_maladie}</p>
                    </div>
                  </div>
                </div>

                {/* Antécédents */}
                {(selectedDossier.antecedents || selectedDossier.antecedents_familiaux || 
                  selectedDossier.gyneco_obstetricaux || selectedDossier.chirurgicaux) && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Antécédents</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedDossier.antecedents && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-medium text-gray-700 mb-2">Antécédents</h4>
                          <p className="text-sm text-gray-900">{selectedDossier.antecedents}</p>
                        </div>
                      )}
                      {selectedDossier.antecedents_familiaux && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-medium text-gray-700 mb-2">Antécédents familiaux</h4>
                          <p className="text-sm text-gray-900">{selectedDossier.antecedents_familiaux}</p>
                        </div>
                      )}
                      {selectedDossier.gyneco_obstetricaux && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-medium text-gray-700 mb-2">Gynéco-Obstétricaux</h4>
                          <p className="text-sm text-gray-900">{selectedDossier.gyneco_obstetricaux}</p>
                        </div>
                      )}
                      {selectedDossier.chirurgicaux && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-medium text-gray-700 mb-2">Chirurgicaux</h4>
                          <p className="text-sm text-gray-900">{selectedDossier.chirurgicaux}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Examens */}
                {(selectedDossier.examen_general || selectedDossier.examen_physique) && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Examens</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedDossier.examen_general && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-medium text-gray-700 mb-2">Examen général</h4>
                          <p className="text-sm text-gray-900">{selectedDossier.examen_general}</p>
                        </div>
                      )}
                      {selectedDossier.examen_physique && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-medium text-gray-700 mb-2">Examen physique</h4>
                          <p className="text-sm text-gray-900">{selectedDossier.examen_physique}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Diagnostic */}
                {(selectedDossier.hypothese_diagnostic || selectedDossier.diagnostic) && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Diagnostic</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedDossier.hypothese_diagnostic && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-medium text-gray-700 mb-2">Hypothèse diagnostic</h4>
                          <p className="text-sm text-gray-900">{selectedDossier.hypothese_diagnostic}</p>
                        </div>
                      )}
                      {selectedDossier.diagnostic && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-medium text-gray-700 mb-2">Diagnostic</h4>
                          <p className="text-sm text-gray-900">{selectedDossier.diagnostic}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Bilan */}
                {(selectedDossier.bilan_biologie || selectedDossier.bilan_imagerie) && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Bilan</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedDossier.bilan_biologie && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-medium text-gray-700 mb-2">Biologie</h4>
                          <p className="text-sm text-gray-900">{selectedDossier.bilan_biologie}</p>
                        </div>
                      )}
                      {selectedDossier.bilan_imagerie && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-medium text-gray-700 mb-2">Imagerie</h4>
                          <p className="text-sm text-gray-900">{selectedDossier.bilan_imagerie}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
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

export default DossiersMedicaux;
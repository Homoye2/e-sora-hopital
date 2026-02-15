import React, { useState, useEffect } from 'react';
import { Plus, Search, Eye, Edit, Trash2, ArrowLeft, Download, FileIcon, X } from 'lucide-react';
import { dossierMedicalService, registreService, authService, fichierDossierMedicalService, type DossierMedical, type DossierMedicalFormData, type Registre, type DossierMedicalDetail, type FichierDossierMedical } from '../services/api';

const DossiersMedicaux: React.FC = () => {
  const [dossiers, setDossiers] = useState<DossierMedical[]>([]);
  const [registres, setRegistres] = useState<Registre[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDossier, setSelectedDossier] = useState<DossierMedicalDetail | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [filters, setFilters] = useState({
    registre: ''
  });

  // État pour les fichiers
  const [fichiers, setFichiers] = useState<{
    gyneco_obstetricaux: File[]
    chirurgicaux: File[]
    examen_general: File[]
    examen_physique: File[]
    hypothese_diagnostic: File[]
    diagnostic: File[]
    biologie: File[]
    imagerie: File[]
  }>({
    gyneco_obstetricaux: [],
    chirurgicaux: [],
    examen_general: [],
    examen_physique: [],
    hypothese_diagnostic: [],
    diagnostic: [],
    biologie: [],
    imagerie: []
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
      let dossierId: number;
      
      if (isEditing && selectedDossier) {
        await dossierMedicalService.update(selectedDossier.id, formData);
        dossierId = selectedDossier.id;
      } else {
        const dossier = await dossierMedicalService.create(formData);
        dossierId = dossier.id;
        
        if (!dossierId) {
          console.error('ID du dossier non trouvé dans la réponse:', dossier);
          throw new Error('Impossible de récupérer l\'ID du dossier créé');
        }
      }
      
      // Upload des fichiers seulement s'il y en a
      const hasFiles = Object.values(fichiers).some(files => files.length > 0);
      
      if (hasFiles) {
        for (const [type, files] of Object.entries(fichiers)) {
          for (const file of files) {
            const formDataFile = new FormData();
            formDataFile.append('type_fichier', type);
            formDataFile.append('fichier', file);
            formDataFile.append('nom_fichier', file.name);
            
            try {
              await dossierMedicalService.uploadFichier(dossierId, formDataFile);
            } catch (uploadError) {
              console.error('Erreur lors de l\'upload du fichier:', file.name, uploadError);
              // Continuer avec les autres fichiers même si un échoue
            }
          }
        }
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

  const handleExportPDF = () => {
    alert('La fonctionnalité d\'export PDF est en cours de développement.\n\nElle sera disponible prochainement pour télécharger le dossier médical complet avec tous les fichiers joints.');
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
    setFichiers({
      gyneco_obstetricaux: [],
      chirurgicaux: [],
      examen_general: [],
      examen_physique: [],
      hypothese_diagnostic: [],
      diagnostic: [],
      biologie: [],
      imagerie: []
    });
    setIsEditing(false);
    setSelectedDossier(null);
  };

  const openEditModal = async (dossier: DossierMedical) => {
    try {
      // Charger les détails complets
      const dossierDetail = await dossierMedicalService.getById(dossier.id);
      setSelectedDossier(dossierDetail);
      setFormData({
        registre: dossierDetail.registre,
        motif_consultation: dossierDetail.motif_consultation,
        histoire_maladie: dossierDetail.histoire_maladie,
        antecedents: dossierDetail.antecedents || '',
        antecedents_familiaux: dossierDetail.antecedents_familiaux || '',
        gyneco_obstetricaux: dossierDetail.gyneco_obstetricaux || '',
        chirurgicaux: dossierDetail.chirurgicaux || '',
        examen_general: dossierDetail.examen_general || '',
        examen_physique: dossierDetail.examen_physique || '',
        hypothese_diagnostic: dossierDetail.hypothese_diagnostic || '',
        diagnostic: dossierDetail.diagnostic || '',
        bilan_biologie: dossierDetail.bilan_biologie || '',
        bilan_imagerie: dossierDetail.bilan_imagerie || ''
      });
      setIsEditing(true);
      setShowModal(true);
    } catch (error) {
      console.error('Erreur lors du chargement du dossier:', error);
      alert('Erreur lors du chargement du dossier.');
    }
  };

  const openDetailModal = async (dossier: DossierMedical) => {
    try {
      // Charger les détails complets avec les fichiers
      const dossierDetail = await dossierMedicalService.getById(dossier.id);
      setSelectedDossier(dossierDetail);
      setShowDetailModal(true);
    } catch (error) {
      console.error('Erreur lors du chargement des détails:', error);
      alert('Erreur lors du chargement des détails du dossier.');
    }
  };

  const handleFileChange = (type: keyof typeof fichiers, files: FileList | null) => {
    if (files) {
      setFichiers(prev => ({
        ...prev,
        [type]: Array.from(files)
      }));
    }
  };

  const removeFile = (type: keyof typeof fichiers, index: number) => {
    setFichiers(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }));
  };

  const handleDownloadFile = async (fichier: FichierDossierMedical) => {
    await fichierDossierMedicalService.download(fichier.id, fichier.nom_fichier);
  };

  const handleDeleteFile = async (fichierId: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce fichier ?')) {
      try {
        await fichierDossierMedicalService.delete(fichierId);
        if (selectedDossier) {
          // Recharger les détails
          const dossierDetail = await dossierMedicalService.getById(selectedDossier.id);
          setSelectedDossier(dossierDetail);
        }
      } catch (error) {
        console.error('Erreur lors de la suppression du fichier:', error);
        alert('Erreur lors de la suppression du fichier.');
      }
    }
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
                          onClick={() => handleExportPDF()}
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
                      
                      {/* Fichiers existants */}
                      {isEditing && selectedDossier?.fichiers_par_type?.gyneco_obstetricaux && 
                       selectedDossier.fichiers_par_type.gyneco_obstetricaux.length > 0 && (
                        <div className="mt-2 mb-2">
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Fichiers existants:
                          </label>
                          <div className="space-y-1">
                            {selectedDossier.fichiers_par_type.gyneco_obstetricaux.map((fichier) => (
                              <div key={fichier.id} className="flex items-center gap-2 text-sm bg-blue-50 p-2 rounded border border-blue-200">
                                <FileIcon className="h-4 w-4 text-blue-500" />
                                <span className="flex-1 truncate">{fichier.nom_fichier}</span>
                                <span className="text-xs text-gray-500">{fichier.taille_fichier_display}</span>
                                <button
                                  type="button"
                                  onClick={() => handleDownloadFile(fichier)}
                                  className="text-blue-600 hover:text-blue-800 p-1"
                                  title="Télécharger"
                                >
                                  <Download className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteFile(fichier.id)}
                                  className="text-red-600 hover:text-red-800 p-1"
                                  title="Supprimer"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Upload de fichiers */}
                      <div className="mt-2">
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          {isEditing ? 'Ajouter des fichiers' : 'Fichiers joints'}
                        </label>
                        <input
                          type="file"
                          multiple
                          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                          onChange={(e) => handleFileChange('gyneco_obstetricaux', e.target.files)}
                          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        {fichiers.gyneco_obstetricaux.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {fichiers.gyneco_obstetricaux.map((file, index) => (
                              <div key={index} className="flex items-center gap-2 text-sm bg-gray-50 p-2 rounded">
                                <FileIcon className="h-4 w-4 text-gray-400" />
                                <span className="flex-1 truncate">{file.name}</span>
                                <span className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} Ko</span>
                                <button
                                  type="button"
                                  onClick={() => removeFile('gyneco_obstetricaux', index)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
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
                      
                      {/* Fichiers existants */}
                      {isEditing && selectedDossier?.fichiers_par_type?.chirurgicaux && 
                       selectedDossier.fichiers_par_type.chirurgicaux.length > 0 && (
                        <div className="mt-2 mb-2">
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Fichiers existants:
                          </label>
                          <div className="space-y-1">
                            {selectedDossier.fichiers_par_type.chirurgicaux.map((fichier) => (
                              <div key={fichier.id} className="flex items-center gap-2 text-sm bg-blue-50 p-2 rounded border border-blue-200">
                                <FileIcon className="h-4 w-4 text-blue-500" />
                                <span className="flex-1 truncate">{fichier.nom_fichier}</span>
                                <span className="text-xs text-gray-500">{fichier.taille_fichier_display}</span>
                                <button
                                  type="button"
                                  onClick={() => handleDownloadFile(fichier)}
                                  className="text-blue-600 hover:text-blue-800 p-1"
                                  title="Télécharger"
                                >
                                  <Download className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteFile(fichier.id)}
                                  className="text-red-600 hover:text-red-800 p-1"
                                  title="Supprimer"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Upload de fichiers */}
                      <div className="mt-2">
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          {isEditing ? 'Ajouter des fichiers' : 'Fichiers joints'}
                        </label>
                        <input
                          type="file"
                          multiple
                          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                          onChange={(e) => handleFileChange('chirurgicaux', e.target.files)}
                          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        {fichiers.chirurgicaux.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {fichiers.chirurgicaux.map((file, index) => (
                              <div key={index} className="flex items-center gap-2 text-sm bg-gray-50 p-2 rounded">
                                <FileIcon className="h-4 w-4 text-gray-400" />
                                <span className="flex-1 truncate">{file.name}</span>
                                <span className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} Ko</span>
                                <button
                                  type="button"
                                  onClick={() => removeFile('chirurgicaux', index)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
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
                      
                      {/* Fichiers existants */}
                      {isEditing && selectedDossier?.fichiers_par_type?.biologie && 
                       selectedDossier.fichiers_par_type.biologie.length > 0 && (
                        <div className="mt-2 mb-2">
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Fichiers existants:
                          </label>
                          <div className="space-y-1">
                            {selectedDossier.fichiers_par_type.biologie.map((fichier) => (
                              <div key={fichier.id} className="flex items-center gap-2 text-sm bg-blue-50 p-2 rounded border border-blue-200">
                                <FileIcon className="h-4 w-4 text-blue-500" />
                                <span className="flex-1 truncate">{fichier.nom_fichier}</span>
                                <span className="text-xs text-gray-500">{fichier.taille_fichier_display}</span>
                                <button
                                  type="button"
                                  onClick={() => handleDownloadFile(fichier)}
                                  className="text-blue-600 hover:text-blue-800 p-1"
                                  title="Télécharger"
                                >
                                  <Download className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteFile(fichier.id)}
                                  className="text-red-600 hover:text-red-800 p-1"
                                  title="Supprimer"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Upload de fichiers */}
                      <div className="mt-2">
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          {isEditing ? 'Ajouter des fichiers (résultats d\'analyses)' : 'Fichiers joints (résultats d\'analyses)'}
                        </label>
                        <input
                          type="file"
                          multiple
                          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                          onChange={(e) => handleFileChange('biologie', e.target.files)}
                          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        {fichiers.biologie.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {fichiers.biologie.map((file, index) => (
                              <div key={index} className="flex items-center gap-2 text-sm bg-gray-50 p-2 rounded">
                                <FileIcon className="h-4 w-4 text-gray-400" />
                                <span className="flex-1 truncate">{file.name}</span>
                                <span className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} Ko</span>
                                <button
                                  type="button"
                                  onClick={() => removeFile('biologie', index)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
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
                      
                      {/* Fichiers existants */}
                      {isEditing && selectedDossier?.fichiers_par_type?.imagerie && 
                       selectedDossier.fichiers_par_type.imagerie.length > 0 && (
                        <div className="mt-2 mb-2">
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Fichiers existants:
                          </label>
                          <div className="space-y-1">
                            {selectedDossier.fichiers_par_type.imagerie.map((fichier) => (
                              <div key={fichier.id} className="flex items-center gap-2 text-sm bg-blue-50 p-2 rounded border border-blue-200">
                                <FileIcon className="h-4 w-4 text-blue-500" />
                                <span className="flex-1 truncate">{fichier.nom_fichier}</span>
                                <span className="text-xs text-gray-500">{fichier.taille_fichier_display}</span>
                                <button
                                  type="button"
                                  onClick={() => handleDownloadFile(fichier)}
                                  className="text-blue-600 hover:text-blue-800 p-1"
                                  title="Télécharger"
                                >
                                  <Download className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteFile(fichier.id)}
                                  className="text-red-600 hover:text-red-800 p-1"
                                  title="Supprimer"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Upload de fichiers */}
                      <div className="mt-2">
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          {isEditing ? 'Ajouter des fichiers (radiographies, IRM, scanner...)' : 'Fichiers joints (radiographies, IRM, scanner...)'}
                        </label>
                        <input
                          type="file"
                          multiple
                          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                          onChange={(e) => handleFileChange('imagerie', e.target.files)}
                          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        {fichiers.imagerie.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {fichiers.imagerie.map((file, index) => (
                              <div key={index} className="flex items-center gap-2 text-sm bg-gray-50 p-2 rounded">
                                <FileIcon className="h-4 w-4 text-gray-400" />
                                <span className="flex-1 truncate">{file.name}</span>
                                <span className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} Ko</span>
                                <button
                                  type="button"
                                  onClick={() => removeFile('imagerie', index)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
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
                  selectedDossier.gyneco_obstetricaux || selectedDossier.chirurgicaux ||
                  selectedDossier.fichiers_par_type?.gyneco_obstetricaux?.length > 0 ||
                  selectedDossier.fichiers_par_type?.chirurgicaux?.length > 0) && (
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
                      {(selectedDossier.gyneco_obstetricaux || selectedDossier.fichiers_par_type?.gyneco_obstetricaux?.length > 0) && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-medium text-gray-700 mb-2">Gynéco-Obstétricaux</h4>
                          {selectedDossier.gyneco_obstetricaux && (
                            <p className="text-sm text-gray-900 mb-3">{selectedDossier.gyneco_obstetricaux}</p>
                          )}
                          
                          {/* Fichiers joints */}
                          {selectedDossier.fichiers_par_type?.gyneco_obstetricaux && selectedDossier.fichiers_par_type.gyneco_obstetricaux.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <h5 className="text-xs font-medium text-gray-600 mb-2">Fichiers joints:</h5>
                              <div className="space-y-2">
                                {selectedDossier.fichiers_par_type.gyneco_obstetricaux.map((fichier) => (
                                  <div key={fichier.id} className="flex items-center gap-2 p-2 bg-white border border-gray-200 rounded">
                                    <FileIcon className="h-4 w-4 text-blue-500" />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-gray-900 truncate">{fichier.nom_fichier}</p>
                                      <p className="text-xs text-gray-500">{fichier.taille_fichier_display}</p>
                                    </div>
                                    <button
                                      onClick={() => handleDownloadFile(fichier)}
                                      className="text-blue-600 hover:text-blue-800 p-1"
                                      title="Télécharger"
                                    >
                                      <Download className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteFile(fichier.id)}
                                      className="text-red-600 hover:text-red-800 p-1"
                                      title="Supprimer"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      {(selectedDossier.chirurgicaux || selectedDossier.fichiers_par_type?.chirurgicaux?.length > 0) && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-medium text-gray-700 mb-2">Chirurgicaux</h4>
                          {selectedDossier.chirurgicaux && (
                            <p className="text-sm text-gray-900 mb-3">{selectedDossier.chirurgicaux}</p>
                          )}
                          
                          {/* Fichiers joints */}
                          {selectedDossier.fichiers_par_type?.chirurgicaux && selectedDossier.fichiers_par_type.chirurgicaux.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <h5 className="text-xs font-medium text-gray-600 mb-2">Fichiers joints:</h5>
                              <div className="space-y-2">
                                {selectedDossier.fichiers_par_type.chirurgicaux.map((fichier) => (
                                  <div key={fichier.id} className="flex items-center gap-2 p-2 bg-white border border-gray-200 rounded">
                                    <FileIcon className="h-4 w-4 text-blue-500" />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-gray-900 truncate">{fichier.nom_fichier}</p>
                                      <p className="text-xs text-gray-500">{fichier.taille_fichier_display}</p>
                                    </div>
                                    <button
                                      onClick={() => handleDownloadFile(fichier)}
                                      className="text-blue-600 hover:text-blue-800 p-1"
                                      title="Télécharger"
                                    >
                                      <Download className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteFile(fichier.id)}
                                      className="text-red-600 hover:text-red-800 p-1"
                                      title="Supprimer"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Examens */}
                {(selectedDossier.examen_general || selectedDossier.examen_physique ||
                  selectedDossier.fichiers_par_type?.examen_general?.length > 0 ||
                  selectedDossier.fichiers_par_type?.examen_physique?.length > 0) && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Examens</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(selectedDossier.examen_general || selectedDossier.fichiers_par_type?.examen_general?.length > 0) && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-medium text-gray-700 mb-2">Examen général</h4>
                          {selectedDossier.examen_general && (
                            <p className="text-sm text-gray-900 mb-3">{selectedDossier.examen_general}</p>
                          )}
                          
                          {/* Fichiers joints */}
                          {selectedDossier.fichiers_par_type?.examen_general && selectedDossier.fichiers_par_type.examen_general.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <h5 className="text-xs font-medium text-gray-600 mb-2">Fichiers joints:</h5>
                              <div className="space-y-2">
                                {selectedDossier.fichiers_par_type.examen_general.map((fichier) => (
                                  <div key={fichier.id} className="flex items-center gap-2 p-2 bg-white border border-gray-200 rounded">
                                    <FileIcon className="h-4 w-4 text-blue-500" />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-gray-900 truncate">{fichier.nom_fichier}</p>
                                      <p className="text-xs text-gray-500">{fichier.taille_fichier_display}</p>
                                    </div>
                                    <button
                                      onClick={() => handleDownloadFile(fichier)}
                                      className="text-blue-600 hover:text-blue-800 p-1"
                                      title="Télécharger"
                                    >
                                      <Download className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteFile(fichier.id)}
                                      className="text-red-600 hover:text-red-800 p-1"
                                      title="Supprimer"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      {(selectedDossier.examen_physique || selectedDossier.fichiers_par_type?.examen_physique?.length > 0) && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-medium text-gray-700 mb-2">Examen physique</h4>
                          {selectedDossier.examen_physique && (
                            <p className="text-sm text-gray-900 mb-3">{selectedDossier.examen_physique}</p>
                          )}
                          
                          {/* Fichiers joints */}
                          {selectedDossier.fichiers_par_type?.examen_physique && selectedDossier.fichiers_par_type.examen_physique.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <h5 className="text-xs font-medium text-gray-600 mb-2">Fichiers joints:</h5>
                              <div className="space-y-2">
                                {selectedDossier.fichiers_par_type.examen_physique.map((fichier) => (
                                  <div key={fichier.id} className="flex items-center gap-2 p-2 bg-white border border-gray-200 rounded">
                                    <FileIcon className="h-4 w-4 text-blue-500" />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-gray-900 truncate">{fichier.nom_fichier}</p>
                                      <p className="text-xs text-gray-500">{fichier.taille_fichier_display}</p>
                                    </div>
                                    <button
                                      onClick={() => handleDownloadFile(fichier)}
                                      className="text-blue-600 hover:text-blue-800 p-1"
                                      title="Télécharger"
                                    >
                                      <Download className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteFile(fichier.id)}
                                      className="text-red-600 hover:text-red-800 p-1"
                                      title="Supprimer"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Diagnostic */}
                {(selectedDossier.hypothese_diagnostic || selectedDossier.diagnostic ||
                  selectedDossier.fichiers_par_type?.hypothese_diagnostic?.length > 0 ||
                  selectedDossier.fichiers_par_type?.diagnostic?.length > 0) && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Diagnostic</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(selectedDossier.hypothese_diagnostic || selectedDossier.fichiers_par_type?.hypothese_diagnostic?.length > 0) && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-medium text-gray-700 mb-2">Hypothèse diagnostic</h4>
                          {selectedDossier.hypothese_diagnostic && (
                            <p className="text-sm text-gray-900 mb-3">{selectedDossier.hypothese_diagnostic}</p>
                          )}
                          
                          {/* Fichiers joints */}
                          {selectedDossier.fichiers_par_type?.hypothese_diagnostic && selectedDossier.fichiers_par_type.hypothese_diagnostic.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <h5 className="text-xs font-medium text-gray-600 mb-2">Fichiers joints:</h5>
                              <div className="space-y-2">
                                {selectedDossier.fichiers_par_type.hypothese_diagnostic.map((fichier) => (
                                  <div key={fichier.id} className="flex items-center gap-2 p-2 bg-white border border-gray-200 rounded">
                                    <FileIcon className="h-4 w-4 text-blue-500" />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-gray-900 truncate">{fichier.nom_fichier}</p>
                                      <p className="text-xs text-gray-500">{fichier.taille_fichier_display}</p>
                                    </div>
                                    <button
                                      onClick={() => handleDownloadFile(fichier)}
                                      className="text-blue-600 hover:text-blue-800 p-1"
                                      title="Télécharger"
                                    >
                                      <Download className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteFile(fichier.id)}
                                      className="text-red-600 hover:text-red-800 p-1"
                                      title="Supprimer"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      {(selectedDossier.diagnostic || selectedDossier.fichiers_par_type?.diagnostic?.length > 0) && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-medium text-gray-700 mb-2">Diagnostic</h4>
                          {selectedDossier.diagnostic && (
                            <p className="text-sm text-gray-900 mb-3">{selectedDossier.diagnostic}</p>
                          )}
                          
                          {/* Fichiers joints */}
                          {selectedDossier.fichiers_par_type?.diagnostic && selectedDossier.fichiers_par_type.diagnostic.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <h5 className="text-xs font-medium text-gray-600 mb-2">Fichiers joints:</h5>
                              <div className="space-y-2">
                                {selectedDossier.fichiers_par_type.diagnostic.map((fichier) => (
                                  <div key={fichier.id} className="flex items-center gap-2 p-2 bg-white border border-gray-200 rounded">
                                    <FileIcon className="h-4 w-4 text-blue-500" />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-gray-900 truncate">{fichier.nom_fichier}</p>
                                      <p className="text-xs text-gray-500">{fichier.taille_fichier_display}</p>
                                    </div>
                                    <button
                                      onClick={() => handleDownloadFile(fichier)}
                                      className="text-blue-600 hover:text-blue-800 p-1"
                                      title="Télécharger"
                                    >
                                      <Download className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteFile(fichier.id)}
                                      className="text-red-600 hover:text-red-800 p-1"
                                      title="Supprimer"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Bilan */}
                {(selectedDossier.bilan_biologie || selectedDossier.bilan_imagerie ||
                  selectedDossier.fichiers_par_type?.biologie?.length > 0 ||
                  selectedDossier.fichiers_par_type?.imagerie?.length > 0) && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Bilan</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(selectedDossier.bilan_biologie || selectedDossier.fichiers_par_type?.biologie?.length > 0) && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-medium text-gray-700 mb-2">Biologie</h4>
                          {selectedDossier.bilan_biologie && (
                            <p className="text-sm text-gray-900 mb-3">{selectedDossier.bilan_biologie}</p>
                          )}
                          
                          {/* Fichiers joints */}
                          {selectedDossier.fichiers_par_type?.biologie && selectedDossier.fichiers_par_type.biologie.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <h5 className="text-xs font-medium text-gray-600 mb-2">Fichiers joints:</h5>
                              <div className="space-y-2">
                                {selectedDossier.fichiers_par_type.biologie.map((fichier) => (
                                  <div key={fichier.id} className="flex items-center gap-2 p-2 bg-white border border-gray-200 rounded">
                                    <FileIcon className="h-4 w-4 text-blue-500" />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-gray-900 truncate">{fichier.nom_fichier}</p>
                                      <p className="text-xs text-gray-500">{fichier.taille_fichier_display}</p>
                                    </div>
                                    <button
                                      onClick={() => handleDownloadFile(fichier)}
                                      className="text-blue-600 hover:text-blue-800 p-1"
                                      title="Télécharger"
                                    >
                                      <Download className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteFile(fichier.id)}
                                      className="text-red-600 hover:text-red-800 p-1"
                                      title="Supprimer"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      {(selectedDossier.bilan_imagerie || selectedDossier.fichiers_par_type?.imagerie?.length > 0) && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-medium text-gray-700 mb-2">Imagerie</h4>
                          {selectedDossier.bilan_imagerie && (
                            <p className="text-sm text-gray-900 mb-3">{selectedDossier.bilan_imagerie}</p>
                          )}
                          
                          {/* Fichiers joints */}
                          {selectedDossier.fichiers_par_type?.imagerie && selectedDossier.fichiers_par_type.imagerie.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <h5 className="text-xs font-medium text-gray-600 mb-2">Fichiers joints:</h5>
                              <div className="space-y-2">
                                {selectedDossier.fichiers_par_type.imagerie.map((fichier) => (
                                  <div key={fichier.id} className="flex items-center gap-2 p-2 bg-white border border-gray-200 rounded">
                                    <FileIcon className="h-4 w-4 text-blue-500" />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-gray-900 truncate">{fichier.nom_fichier}</p>
                                      <p className="text-xs text-gray-500">{fichier.taille_fichier_display}</p>
                                    </div>
                                    <button
                                      onClick={() => handleDownloadFile(fichier)}
                                      className="text-blue-600 hover:text-blue-800 p-1"
                                      title="Télécharger"
                                    >
                                      <Download className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteFile(fichier.id)}
                                      className="text-red-600 hover:text-red-800 p-1"
                                      title="Supprimer"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
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
import React, { useState, useEffect } from 'react';
import { Plus, Search, Eye, Edit, Trash2, Check, X, ArrowLeft, QrCode, Download } from 'lucide-react';
import { ordonnanceService, registreService, authService, produitService, type Ordonnance, type OrdonnanceFormData, type LigneOrdonnanceFormData, type Registre, type Produit } from '../services/api';

const Ordonnances: React.FC = () => {
  const [ordonnances, setOrdonnances] = useState<Ordonnance[]>([]);
  const [registres, setRegistres] = useState<Registre[]>([]);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [produitsFiltered, setProduitsFiltered] = useState<Produit[]>([]);
  const [showProduitSuggestions, setShowProduitSuggestions] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedOrdonnance, setSelectedOrdonnance] = useState<Ordonnance | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [filters, setFilters] = useState({
    statut: '',
    registre: ''
  });

  // Récupérer le registre depuis l'URL si présent
  const urlParams = new URLSearchParams(window.location.search);
  const registreIdFromUrl = urlParams.get('registre');

  const [formData, setFormData] = useState<OrdonnanceFormData>({
    registre: registreIdFromUrl ? parseInt(registreIdFromUrl) : 0,
    diagnostic: '',
    instructions_generales: '',
    lignes: []
  });

  const [nouvelleLigne, setNouvelleLigne] = useState<LigneOrdonnanceFormData>({
    nom_medicament: '',
    dosage: '',
    quantite: 1,
    unite: 'comprime',
    frequence: '1_fois_jour',
    moment_prise: 'apres_repas',
    duree_traitement: 1,
    instructions: ''
  });

  useEffect(() => {
    // Vérifier l'authentification
    if (!authService.isAuthenticated()) {
      window.location.href = '/login';
      return;
    }
    
    fetchOrdonnances();
    fetchRegistres();
    fetchProduits();
  }, [filters]);

  const fetchProduits = async () => {
    try {
      const response = await produitService.getAll({ actif: true });
      const produitsArray = Array.isArray(response) ? response : response.results || [];
      setProduits(produitsArray);
    } catch (error) {
      console.error('Erreur lors du chargement des produits:', error);
      // Ne pas bloquer si les produits ne sont pas disponibles
    }
  };

  const fetchOrdonnances = async () => {
    try {
      setLoading(true);
      const response = await ordonnanceService.getAll({
        statut: filters.statut || undefined,
        registre: filters.registre ? parseInt(filters.registre) : undefined,
        search: searchTerm || undefined
      });
      setOrdonnances(response.results || response);
    } catch (error: any) {
      console.error('Erreur lors du chargement des ordonnances:', error);
      
      if (error.response?.status === 401) {
        alert('Session expirée. Veuillez vous reconnecter.');
        window.location.href = '/login';
        return;
      }
      
      alert('Erreur lors du chargement des ordonnances. Veuillez réessayer.');
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
    
    if (formData.lignes.length === 0) {
      alert('Veuillez ajouter au moins un médicament à l\'ordonnance.');
      return;
    }
    
    try {
      if (isEditing && selectedOrdonnance) {
        await ordonnanceService.update(selectedOrdonnance.id, formData);
      } else {
        await ordonnanceService.create(formData);
      }
      
      fetchOrdonnances();
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
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette ordonnance ?')) {
      try {
        await ordonnanceService.delete(id);
        fetchOrdonnances();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression de l\'ordonnance.');
      }
    }
  };

  const handleValider = async (id: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir valider cette ordonnance ?')) {
      try {
        // Valider l'ordonnance
        await ordonnanceService.valider(id);
        
        // Générer automatiquement le QR code après validation
        try {
          await ordonnanceService.genererQRCode(id);
          console.log('QR Code généré automatiquement après validation');
        } catch (qrError) {
          console.error('Erreur lors de la génération du QR code:', qrError);
          // Ne pas bloquer le processus si la génération du QR code échoue
        }
        
        fetchOrdonnances();
      } catch (error) {
        console.error('Erreur lors de la validation:', error);
        alert('Erreur lors de la validation de l\'ordonnance.');
      }
    }
  };

  const handleAnnuler = async (id: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir annuler cette ordonnance ?')) {
      try {
        await ordonnanceService.annuler(id);
        fetchOrdonnances();
      } catch (error) {
        console.error('Erreur lors de l\'annulation:', error);
        alert('Erreur lors de l\'annulation de l\'ordonnance.');
      }
    }
  };

  const handleGenererQRCode = async (id: number) => {
    try {
      await ordonnanceService.genererQRCode(id);
      alert('QR code généré avec succès !');
      fetchOrdonnances(); // Recharger pour afficher le QR code
    } catch (error) {
      console.error('Erreur lors de la génération du QR code:', error);
      alert('Erreur lors de la génération du QR code.');
    }
  };

  const handleTelechargerPDF = async (ordonnance: Ordonnance) => {
    try {
      // Create a safe filename with fallback values
      const patientName = ordonnance.registre_patient_nom || 
                         `${ordonnance.patient_nom || 'Patient'}_${ordonnance.patient_prenom || ''}`.trim() ||
                         'Patient';
      const filename = `Ordonnance_${ordonnance.numero_ordonnance}_${patientName.replace(/\s+/g, '_')}.pdf`;
      const success = await ordonnanceService.telechargerPDF(ordonnance.id, filename);
      if (!success) {
        alert('Erreur lors du téléchargement du PDF.');
      }
    } catch (error) {
      console.error('Erreur lors du téléchargement du PDF:', error);
      alert('Erreur lors du téléchargement du PDF.');
    }
  };

  const resetForm = () => {
    setFormData({
      registre: registreIdFromUrl ? parseInt(registreIdFromUrl) : 0,
      diagnostic: '',
      instructions_generales: '',
      lignes: []
    });
    setNouvelleLigne({
      nom_medicament: '',
      dosage: '',
      quantite: 1,
      unite: 'comprime',
      frequence: '1_fois_jour',
      moment_prise: 'apres_repas',
      duree_traitement: 1,
      instructions: ''
    });
    setIsEditing(false);
    setSelectedOrdonnance(null);
  };

  const ajouterLigne = () => {
    if (!nouvelleLigne.nom_medicament.trim() || !nouvelleLigne.dosage.trim()) {
      alert('Veuillez remplir au moins le nom du médicament et le dosage.');
      return;
    }

    if (nouvelleLigne.quantite <= 0) {
      alert('La quantité doit être supérieure à 0.');
      return;
    }

    if (nouvelleLigne.duree_traitement <= 0) {
      alert('La durée du traitement doit être supérieure à 0.');
      return;
    }

    setFormData(prev => ({
      ...prev,
      lignes: [...prev.lignes, { ...nouvelleLigne }]
    }));

    setNouvelleLigne({
      nom_medicament: '',
      dosage: '',
      quantite: 1,
      unite: 'comprime',
      frequence: '1_fois_jour',
      moment_prise: 'apres_repas',
      duree_traitement: 1,
      instructions: ''
    });
    
    // Réinitialiser les suggestions
    setShowProduitSuggestions(false);
    setProduitsFiltered([]);
  };

  const handleProduitSearch = (value: string) => {
    setNouvelleLigne(prev => ({ ...prev, nom_medicament: value }));
    
    if (value.trim().length > 0 && produits.length > 0) {
      // Filtrer les produits qui commencent par la valeur saisie (insensible à la casse)
      const filtered = produits.filter(produit =>
        produit.nom.toLowerCase().startsWith(value.toLowerCase())
      );
      setProduitsFiltered(filtered);
      setShowProduitSuggestions(filtered.length > 0);
    } else {
      setProduitsFiltered([]);
      setShowProduitSuggestions(false);
    }
  };

  const selectProduit = (produit: Produit) => {
    setNouvelleLigne(prev => ({
      ...prev,
      nom_medicament: produit.nom,
      dosage: produit.dosage || prev.dosage
    }));
    setShowProduitSuggestions(false);
    setProduitsFiltered([]);
  };

  const supprimerLigne = (index: number) => {
    setFormData(prev => ({
      ...prev,
      lignes: prev.lignes.filter((_, i) => i !== index)
    }));
  };

  const openEditModal = (ordonnance: Ordonnance) => {
    setSelectedOrdonnance(ordonnance);
    setFormData({
      registre: ordonnance.registre,
      diagnostic: ordonnance.diagnostic || '',
      instructions_generales: ordonnance.instructions_generales,
      lignes: ordonnance.lignes?.map(ligne => ({
        nom_medicament: ligne.nom_medicament || ligne.nom_complet || '',
        dosage: ligne.dosage || '',
        quantite: ligne.quantite || 1,
        unite: ligne.unite || 'comprime',
        frequence: ligne.frequence || '1_fois_jour',
        moment_prise: ligne.moment_prise || 'apres_repas',
        duree_traitement: ligne.duree_traitement || 1,
        instructions: ligne.instructions || ''
      })) || []
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const openDetailModal = (ordonnance: Ordonnance) => {
    setSelectedOrdonnance(ordonnance);
    setShowDetailModal(true);
  };

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'brouillon':
        return 'bg-gray-100 text-gray-800';
      case 'validee':
        return 'bg-green-100 text-green-800';
      case 'delivree':
        return 'bg-blue-100 text-blue-800';
      case 'annulee':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredOrdonnances = ordonnances.filter(ordonnance =>
    ordonnance.numero_ordonnance.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (ordonnance.registre_patient_nom && ordonnance.registre_patient_nom.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (ordonnance.patient_nom && ordonnance.patient_nom.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (ordonnance.patient_prenom && ordonnance.patient_prenom.toLowerCase().includes(searchTerm.toLowerCase())) ||
    ordonnance.specialiste_nom.toLowerCase().includes(searchTerm.toLowerCase())
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
            <h1 className="text-2xl font-bold text-gray-900">Ordonnances</h1>
            <p className="text-gray-600">Gestion des ordonnances médicales</p>
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
          Nouvelle Ordonnance
        </button>
      </div>

      {/* Filtres et recherche */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            value={filters.statut}
            onChange={(e) => setFilters(prev => ({ ...prev, statut: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Tous les statuts</option>
            <option value="brouillon">Brouillon</option>
            <option value="validee">Validée</option>
            <option value="delivree">Délivrée</option>
            <option value="annulee">Annulée</option>
          </select>

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

      {/* Liste des ordonnances */}
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
                    N° Ordonnance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Spécialiste
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
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
                {filteredOrdonnances.map((ordonnance) => (
                  <tr key={ordonnance.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {ordonnance.numero_ordonnance}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {ordonnance.registre_patient_nom || `${ordonnance.patient_nom} ${ordonnance.patient_prenom}`}
                      </div>
                      {ordonnance.patient_nom_complet && (
                        <div className="text-sm text-green-600">
                          Compte: {ordonnance.patient_nom_complet}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {ordonnance.specialiste_nom}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatutColor(ordonnance.statut)}`}>
                        {ordonnance.statut_display}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(ordonnance.date_prescription).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openDetailModal(ordonnance)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Voir détails"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {ordonnance.statut === 'brouillon' && (
                          <>
                            <button
                              onClick={() => openEditModal(ordonnance)}
                              className="text-indigo-600 hover:text-indigo-900"
                              title="Modifier"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleValider(ordonnance.id)}
                              className="text-green-600 hover:text-green-900"
                              title="Valider"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {ordonnance.statut === 'validee' && (
                          <>
                            <button
                              onClick={() => handleTelechargerPDF(ordonnance)}
                              className="text-purple-600 hover:text-purple-900"
                              title="Télécharger PDF"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            {ordonnance.qr_code ? (
                              <button
                                onClick={() => {
                                  setSelectedOrdonnance(ordonnance)
                                  setShowQRModal(true)
                                }}
                                className="text-green-600 hover:text-green-900"
                                title="Voir QR Code"
                              >
                                <QrCode className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleGenererQRCode(ordonnance.id)}
                                className="text-orange-600 hover:text-orange-900"
                                title="Générer QR Code"
                              >
                                <QrCode className="w-4 h-4" />
                              </button>
                            )}
                          </>
                        )}
                        {ordonnance.statut !== 'delivree' && (
                          <button
                            onClick={() => handleAnnuler(ordonnance.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Annuler"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(ordonnance.id)}
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
            
            {filteredOrdonnances.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                Aucune ordonnance trouvée
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
                  {isEditing ? 'Modifier l\'ordonnance' : 'Nouvelle ordonnance'}
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

                {/* Diagnostic */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Diagnostic *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={formData.diagnostic}
                    onChange={(e) => setFormData(prev => ({ ...prev, diagnostic: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Diagnostic médical détaillé..."
                  />
                </div>

                {/* Instructions générales */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Instructions générales
                  </label>
                  <textarea
                    rows={3}
                    value={formData.instructions_generales}
                    onChange={(e) => setFormData(prev => ({ ...prev, instructions_generales: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Instructions générales pour le patient..."
                  />
                </div>

                {/* Médicaments */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Médicaments</h3>
                  
                  {/* Liste des médicaments ajoutés */}
                  {formData.lignes.length > 0 && (
                    <div className="mb-4 space-y-2">
                      {formData.lignes.map((ligne, index) => (
                        <div key={index} className="bg-gray-50 p-3 rounded-lg flex justify-between items-center">
                          <div className="flex-1">
                            <div className="font-medium">{ligne.nom_medicament}</div>
                            <div className="text-sm text-gray-600">
                              {ligne.dosage} • {ligne.quantite} {ligne.unite} • {ligne.frequence}
                              {ligne.duree_traitement && ` • ${ligne.duree_traitement} jours`}
                            </div>
                            {ligne.instructions && (
                              <div className="text-sm text-gray-500 italic">{ligne.instructions}</div>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => supprimerLigne(index)}
                            className="text-red-600 hover:text-red-800 ml-4"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Formulaire d'ajout de médicament */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Ajouter un médicament</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nom du médicament *
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={nouvelleLigne.nom_medicament}
                            onChange={(e) => handleProduitSearch(e.target.value)}
                            onFocus={() => {
                              if (nouvelleLigne.nom_medicament.trim().length > 0 && produitsFiltered.length > 0) {
                                setShowProduitSuggestions(true);
                              }
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Ex: Paracétamol (tapez pour rechercher)"
                            autoComplete="off"
                          />
                          {showProduitSuggestions && produitsFiltered.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                              {produitsFiltered.map((produit) => (
                                <button
                                  key={produit.id}
                                  type="button"
                                  onClick={() => selectProduit(produit)}
                                  className="w-full text-left px-4 py-2 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none border-b border-gray-100 last:border-b-0"
                                >
                                  <div className="font-medium text-gray-900">{produit.nom}</div>
                                  {produit.dosage && (
                                    <div className="text-sm text-gray-600">{produit.dosage}</div>
                                  )}
                                  {produit.fabricant && (
                                    <div className="text-xs text-gray-500">{produit.fabricant}</div>
                                  )}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        {produits.length === 0 && (
                          <p className="text-xs text-gray-500 mt-1">
                            Aucun produit dans la base. Saisie manuelle activée.
                          </p>
                        )}
                        {produits.length > 0 && (
                          <p className="text-xs text-gray-500 mt-1">
                            {produits.length} produit(s) disponible(s) dans la base
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Dosage *
                        </label>
                        <input
                          type="text"
                          value={nouvelleLigne.dosage}
                          onChange={(e) => setNouvelleLigne(prev => ({ ...prev, dosage: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Ex: 500mg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Unité
                        </label>
                        <select
                          value={nouvelleLigne.unite}
                          onChange={(e) => setNouvelleLigne(prev => ({ ...prev, unite: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="comprime">Comprimé(s)</option>
                          <option value="gelule">Gélule(s)</option>
                          <option value="ml">ml</option>
                          <option value="mg">mg</option>
                          <option value="g">g</option>
                          <option value="sachet">Sachet(s)</option>
                          <option value="ampoule">Ampoule(s)</option>
                          <option value="suppositoire">Suppositoire(s)</option>
                          <option value="application">Application(s)</option>
                          <option value="goutte">Goutte(s)</option>
                          <option value="autre">Autre</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Quantité
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={nouvelleLigne.quantite}
                          onChange={(e) => setNouvelleLigne(prev => ({ ...prev, quantite: parseInt(e.target.value) || 1 }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Posologie *
                        </label>
                        <select
                          value={nouvelleLigne.frequence}
                          onChange={(e) => setNouvelleLigne(prev => ({ ...prev, frequence: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="1_fois_jour">1 fois par jour</option>
                          <option value="2_fois_jour">2 fois par jour</option>
                          <option value="3_fois_jour">3 fois par jour</option>
                          <option value="4_fois_jour">4 fois par jour</option>
                          <option value="matin">Le matin</option>
                          <option value="midi">À midi</option>
                          <option value="soir">Le soir</option>
                          <option value="coucher">Au coucher</option>
                          <option value="si_besoin">Si besoin</option>
                          <option value="autre">Autre</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Moment de prise
                        </label>
                        <select
                          value={nouvelleLigne.moment_prise}
                          onChange={(e) => setNouvelleLigne(prev => ({ ...prev, moment_prise: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="avant_repas">Avant les repas</option>
                          <option value="pendant_repas">Pendant les repas</option>
                          <option value="apres_repas">Après les repas</option>
                          <option value="jeun">À jeun</option>
                          <option value="coucher">Au coucher</option>
                          <option value="si_besoin">Si besoin</option>
                          <option value="autre">Autre</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Durée du traitement (jours)
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={nouvelleLigne.duree_traitement}
                          onChange={(e) => setNouvelleLigne(prev => ({ ...prev, duree_traitement: parseInt(e.target.value) || 1 }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Ex: 7"
                        />
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Instructions spécifiques
                      </label>
                      <input
                        type="text"
                        value={nouvelleLigne.instructions}
                        onChange={(e) => setNouvelleLigne(prev => ({ ...prev, instructions: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Ex: À prendre après les repas"
                      />
                    </div>
                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={ajouterLigne}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                      >
                        Ajouter le médicament
                      </button>
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
                    {isEditing ? 'Mettre à jour' : 'Créer l\'ordonnance'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de détails */}
      {showDetailModal && selectedOrdonnance && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Détails de l'ordonnance
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
                    <span className="text-sm font-medium text-gray-500">N° Ordonnance:</span>
                    <p className="text-sm text-gray-900">{selectedOrdonnance.numero_ordonnance}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Patient:</span>
                    <p className="text-sm text-gray-900">
                      {selectedOrdonnance.registre_patient_nom || 
                       `${selectedOrdonnance.patient_nom || ''} ${selectedOrdonnance.patient_prenom || ''}`.trim() ||
                       'Patient non spécifié'}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Spécialiste:</span>
                    <p className="text-sm text-gray-900">{selectedOrdonnance.specialiste_nom}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Statut:</span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatutColor(selectedOrdonnance.statut)}`}>
                      {selectedOrdonnance.statut_display}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Date de prescription:</span>
                    <p className="text-sm text-gray-900">{new Date(selectedOrdonnance.date_prescription).toLocaleDateString('fr-FR')}</p>
                  </div>
                  {selectedOrdonnance.date_validation && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">Date de validation:</span>
                      <p className="text-sm text-gray-900">{new Date(selectedOrdonnance.date_validation).toLocaleDateString('fr-FR')}</p>
                    </div>
                  )}
                </div>

                {/* Instructions générales */}
                {selectedOrdonnance.instructions_generales && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Instructions générales</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-900">{selectedOrdonnance.instructions_generales}</p>
                    </div>
                  </div>
                )}

                {/* Diagnostic */}
                {selectedOrdonnance.diagnostic && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Diagnostic</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-900">{selectedOrdonnance.diagnostic}</p>
                    </div>
                  </div>
                )}

                {/* Observations */}
                {selectedOrdonnance.observations && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Observations</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-900">{selectedOrdonnance.observations}</p>
                    </div>
                  </div>
                )}

                {/* Médicaments */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Médicaments prescrits</h3>
                  <div className="space-y-3">
                    {selectedOrdonnance.lignes && selectedOrdonnance.lignes.length > 0 ? selectedOrdonnance.lignes.map((ligne, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{ligne.nom_medicament}</h4>
                            <div className="mt-1 text-sm text-gray-600">
                              <p><strong>Dosage:</strong> {ligne.dosage}</p>
                              <p><strong>Quantité:</strong> {ligne.quantite} {ligne.unite}</p>
                              <p><strong>Posologie:</strong> {ligne.frequence}</p>
                              {ligne.duree_traitement && (
                                <p><strong>Durée:</strong> {ligne.duree_traitement} jours</p>
                              )}
                              {ligne.instructions && (
                                <p><strong>Instructions:</strong> {ligne.instructions}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )) : (
                      <p className="text-gray-500 text-center py-4">Aucun médicament prescrit</p>
                    )}
                  </div>
                </div>

                {/* Informations de délivrance */}
                {selectedOrdonnance.statut === 'delivree' && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Informations de délivrance</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedOrdonnance.pharmacie_nom && (
                          <div>
                            <span className="text-sm font-medium text-gray-500">Pharmacie:</span>
                            <p className="text-sm text-gray-900">{selectedOrdonnance.pharmacie_nom}</p>
                          </div>
                        )}
                        {selectedOrdonnance.date_delivrance && (
                          <div>
                            <span className="text-sm font-medium text-gray-500">Date de délivrance:</span>
                            <p className="text-sm text-gray-900">{new Date(selectedOrdonnance.date_delivrance).toLocaleDateString('fr-FR')}</p>
                          </div>
                        )}
                        {selectedOrdonnance.delivree_par_nom && (
                          <div>
                            <span className="text-sm font-medium text-gray-500">Délivrée par:</span>
                            <p className="text-sm text-gray-900">{selectedOrdonnance.delivree_par_nom}</p>
                          </div>
                        )}
                      </div>
                      {selectedOrdonnance.notes_pharmacien && (
                        <div className="mt-4">
                          <span className="text-sm font-medium text-gray-500">Notes du pharmacien:</span>
                          <p className="text-sm text-gray-900 mt-1">{selectedOrdonnance.notes_pharmacien}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* QR Code et PDF */}
                {selectedOrdonnance.statut === 'validee' && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Téléchargement et partage</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex flex-col md:flex-row gap-4 items-start">
                        {/* QR Code */}
                        <div className="flex-1">
                          {selectedOrdonnance.qr_code_url_display ? (
                            <div className="text-center">
                              <p className="text-sm font-medium text-gray-700 mb-2">QR Code pour télécharger le PDF</p>
                              <img 
                                src={selectedOrdonnance.qr_code_url_display} 
                                alt="QR Code" 
                                className="mx-auto border border-gray-300 rounded"
                                style={{ width: '200px', height: '200px' }}
                                onError={(e) => {
                                  console.error('Erreur de chargement du QR code:', e);
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                              <p className="text-xs text-gray-500 mt-2">
                                Scannez ce code pour télécharger l'ordonnance en PDF
                              </p>
                            </div>
                          ) : (
                            <div className="text-center">
                              <p className="text-sm text-gray-600 mb-2">QR Code non généré</p>
                              <button
                                onClick={() => handleGenererQRCode(selectedOrdonnance.id)}
                                className="bg-orange-600 text-white px-3 py-1 rounded text-sm hover:bg-orange-700"
                              >
                                <QrCode className="w-20 h-20 inline mr-1" />
                                
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Actions PDF */}
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-700 mb-2">Actions</p>
                          <div className="space-y-2">
                            <button
                              onClick={() => handleTelechargerPDF(selectedOrdonnance)}
                              className="w-full bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 flex items-center justify-center"
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Télécharger PDF
                            </button>
                            {selectedOrdonnance.qr_code_url && (
                              <div className="text-xs text-gray-500">
                                <p>URL de téléchargement:</p>
                                <p className="break-all font-mono bg-gray-100 p-1 rounded">
                                  {selectedOrdonnance.qr_code_url}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
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

      {/* Modal QR Code */}
      {showQRModal && selectedOrdonnance && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  QR Code - Ordonnance {selectedOrdonnance.numero_ordonnance}
                </h2>
                <button
                  onClick={() => setShowQRModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="text-center">
                {selectedOrdonnance.qr_code_url_display ? (
                  <div>
                    <img 
                      src={selectedOrdonnance.qr_code_url_display} 
                      alt="QR Code" 
                      className="mx-auto border border-gray-300 rounded mb-4"
                      style={{ width: '250px', height: '250px' }}
                      onError={(e) => {
                        console.error('Erreur de chargement du QR code:', e);
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    <p className="text-sm text-gray-600 mb-4">
                      Scannez ce code pour télécharger l'ordonnance en PDF
                    </p>
                    
                    {selectedOrdonnance.qr_code_url && (
                      <div className="text-xs text-gray-500 mb-4">
                        <p className="mb-1">URL de téléchargement:</p>
                        <p className="break-all font-mono bg-gray-100 p-2 rounded">
                          {selectedOrdonnance.qr_code_url}
                        </p>
                      </div>
                    )}
                    
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => handleTelechargerPDF(selectedOrdonnance)}
                        className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 flex items-center"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Télécharger PDF
                      </button>
                      
                      <button
                        onClick={() => handleGenererQRCode(selectedOrdonnance.id)}
                        className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 flex items-center"
                      >
                        <QrCode className="w-4 h-4 mr-2" />
                        Régénérer QR
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-gray-600 mb-4">QR Code non disponible</p>
                    <button
                      onClick={() => handleGenererQRCode(selectedOrdonnance.id)}
                      className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 flex items-center mx-auto"
                    >
                      <QrCode className="w-4 h-4 mr-2" />
                      Générer QR Code
                    </button>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-6 border-t mt-6">
                <button
                  onClick={() => setShowQRModal(false)}
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

export default Ordonnances;
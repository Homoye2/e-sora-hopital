# Manuel d'Utilisation - E-Sora Hôpital

## Table des Matières

1. [Introduction](#introduction)
2. [Rôles et Permissions](#rôles-et-permissions)
3. [Connexion à l'Application](#connexion-à-lapplication)
4. [Guide par Rôle](#guide-par-rôle)
   - [Administrateur d'Hôpital](#administrateur-dhôpital)
   - [Spécialiste](#spécialiste)
5. [Pages Communes](#pages-communes)
6. [Fonctionnalités Avancées](#fonctionnalités-avancées)
7. [Dépannage](#dépannage)

---

## Introduction

E-Sora Hôpital est une application web de gestion hospitalière qui permet aux administrateurs d'hôpitaux et aux spécialistes de gérer efficacement les consultations, rendez-vous, patients et autres aspects de la gestion hospitalière.

### Fonctionnalités Principales
- Gestion des rendez-vous patients
- Suivi des consultations médicales
- Gestion des spécialistes et spécialités
- Création et suivi des ordonnances
- Gestion des dossiers médicaux
- Rapports et statistiques
- Notifications en temps réel

---

## Rôles et Permissions

### Administrateur d'Hôpital (`admin_hopital`)
**Permissions complètes :**
- Gestion de l'hôpital (informations, paramètres)
- Gestion des spécialistes
- Vue d'ensemble de tous les rendez-vous
- Accès à toutes les consultations
- Gestion des paramètres système
- Accès aux statistiques globales

### Spécialiste (`specialiste`)
**Permissions limitées :**
- Gestion de ses propres rendez-vous
- Création et modification de ses consultations
- Gestion de ses disponibilités
- Création d'ordonnances pour ses patients
- Accès à ses propres statistiques
- Modification de son profil personnel

---

## Connexion à l'Application

### Page de Connexion

**URL :** `/login`

**Éléments de la page :**
- Logo E-Sora Hôpital
- Champ Email
- Champ Mot de passe
- Bouton "Se connecter"
- Lien de support technique

**Processus de connexion :**
1. Saisissez votre adresse email professionnelle
2. Entrez votre mot de passe
3. Cliquez sur "Se connecter"
4. En cas de succès, redirection vers le Dashboard
5. En cas d'erreur, message d'erreur affiché

**Comptes de test disponibles :**
- Administrateur : `admin@hopital.sn` / `password123`
- Spécialiste : `specialiste@hopital.sn` / `password123`

---

## Guide par Rôle

## Administrateur d'Hôpital

### Dashboard - Vue d'ensemble

**URL :** `/dashboard`

**Métriques affichées :**
- **Spécialistes :** Nombre total et actifs
- **Rendez-vous :** Total et en attente
- **Consultations :** Total et du mois en cours
- **Confirmés :** Rendez-vous confirmés

**Sections principales :**
1. **Informations de l'hôpital :** Nom, ville, logo
2. **Prochains rendez-vous :** Liste des 5 prochains RDV confirmés
3. **Statistiques par spécialité :** Répartition des activités

**Actions disponibles :**
- Consultation des détails de chaque métrique
- Navigation vers les sections spécialisées
- Actualisation automatique des données

### Gestion des Spécialistes

**URL :** `/specialistes`

**Fonctionnalités :**
- **Création de spécialiste :**
  - Informations personnelles (nom, email)
  - Spécialité et numéro d'ordre
  - Tarifs et durée de consultation
  - Biographie et expérience
  - Paramètres de disponibilité

- **Gestion existante :**
  - Modification des informations
  - Activation/désactivation
  - Suppression (avec confirmation)

**Processus de création :**
1. Cliquer sur "Nouveau Spécialiste"
2. Remplir le formulaire complet
3. Définir les tarifs et disponibilités
4. Valider la création
5. Le spécialiste reçoit ses identifiants par email

### Gestion des Rendez-vous

**URL :** `/rendez-vous`

**Vue d'ensemble :**
- Tous les rendez-vous de l'hôpital
- Filtrage par spécialiste, statut, date
- Actions de gestion globale

**Statuts des rendez-vous :**
- **En attente :** Nouveau rendez-vous non traité
- **Confirmé :** Validé par le spécialiste
- **Refusé :** Rejeté avec motif
- **Annulé :** Annulé par le patient ou l'hôpital
- **Terminé :** Consultation effectuée

**Actions administrateur :**
- Visualisation de tous les rendez-vous
- Filtrage et recherche avancée
- Export des données
- Statistiques de fréquentation

### Consultations - Vue Globale

**URL :** `/consultations`

**Fonctionnalités :**
- Vue de toutes les consultations de l'hôpital
- Filtrage par spécialiste et période
- Statistiques de consultation
- Export des rapports

**Informations affichées :**
- Patient et spécialiste
- Date et diagnostic
- Méthodes prescrites/posées
- Statut de la consultation

### Paramètres de l'Hôpital

**URL :** `/parametres`

**Onglet Hôpital :**
- **Informations générales :**
  - Nom et code de l'hôpital
  - Adresse complète
  - Contacts (téléphone, email)
  - Description et couleur thème

- **Géolocalisation :**
  - Coordonnées GPS automatiques
  - Saisie manuelle des coordonnées
  - Validation et sauvegarde

- **Horaires d'ouverture :**
  - Configuration par jour de la semaine
  - Format : "08:00-17:00" ou "Fermé"
  - Sauvegarde automatique

**Processus de géolocalisation :**
1. Cliquer sur "Obtenir ma position"
2. Autoriser l'accès à la localisation
3. Vérifier les coordonnées affichées
4. Sauvegarder les modifications

---

## Spécialiste

### Dashboard Personnel

**URL :** `/dashboard`

**Métriques personnelles :**
- **Mes Rendez-vous :** Total et en attente
- **Consultations :** Total et du mois
- **Note Moyenne :** Évaluation patients
- **Expérience :** Années d'exercice

**Informations de profil :**
- Spécialité et numéro d'ordre
- Tarif et durée de consultation
- Statut nouveaux patients
- Statistiques personnelles

### Gestion des Rendez-vous

**URL :** `/rendez-vous`

**Actions spécialiste :**
- **Confirmer un rendez-vous :**
  1. Sélectionner le rendez-vous en attente
  2. Cliquer sur "Confirmer"
  3. Ajouter des notes si nécessaire
  4. Valider la confirmation

- **Refuser un rendez-vous :**
  1. Sélectionner le rendez-vous
  2. Cliquer sur "Refuser"
  3. Indiquer le motif obligatoire
  4. Confirmer le refus

- **Annuler un rendez-vous :**
  1. Sélectionner le rendez-vous confirmé
  2. Cliquer sur "Annuler"
  3. Préciser la raison
  4. Valider l'annulation

### Consultations Personnelles

**URL :** `/consultations`

**Création de consultation :**
1. Cliquer sur "Nouvelle Consultation"
2. Sélectionner le patient (ID ou rendez-vous)
3. Remplir l'anamnèse (historique médical)
4. Décrire l'examen clinique
5. Proposer/prescrire des méthodes
6. Indiquer si méthode posée
7. Noter les effets secondaires
8. Ajouter observations et notes
9. Sauvegarder la consultation

**Modification de consultation :**
1. Cliquer sur l'icône "Modifier"
2. Mettre à jour les informations
3. Sauvegarder les modifications

**Création de rapport :**
1. Cliquer sur l'icône "Rapport"
2. Saisir le titre du rapport
3. Rédiger le contenu détaillé
4. Envoyer le rapport

### Gestion des Disponibilités

**URL :** `/disponibilites`

**Configuration des créneaux :**
- Définition des jours de travail
- Horaires de consultation
- Pauses et indisponibilités
- Créneaux d'urgence

**Types de disponibilités :**
- **Consultation normale :** Créneaux standards
- **Urgence :** Créneaux d'urgence
- **Indisponible :** Congés, formations
- **En ligne :** Téléconsultations

### Ordonnances

**URL :** `/ordonnances`

**Création d'ordonnance :**
1. Sélectionner le patient
2. Ajouter les médicaments
3. Préciser posologies et durées
4. Générer le QR code
5. Imprimer ou envoyer

**Gestion des ordonnances :**
- Historique des prescriptions
- Modification avant validation
- Suivi de l'exécution
- Statistiques de prescription

### Dossiers Médicaux

**URL :** `/dossiers-medicaux`

**Fonctionnalités :**
- Consultation des dossiers patients
- Ajout d'informations médicales
- Historique des consultations
- Documents et examens

### Paramètres Personnels

**URL :** `/parametres`

**Onglet Profil :**
- Modification nom et email
- Mise à jour des informations
- Sauvegarde des modifications

**Onglet Sécurité :**
- Changement de mot de passe
- Vérification mot de passe actuel
- Confirmation nouveau mot de passe

---

## Pages Communes

### Notifications

**URL :** `/notifications`

**Types de notifications :**
- Nouveaux rendez-vous
- Confirmations/annulations
- Messages patients
- Alertes système
- Rappels de consultation

**Gestion :**
- Marquer comme lu/non lu
- Filtrage par type
- Suppression groupée
- Paramètres de notification

### Rapports

**URL :** `/rapports`

**Types de rapports :**
- Activité mensuelle
- Statistiques consultations
- Performance spécialistes
- Satisfaction patients

**Fonctionnalités :**
- Génération automatique
- Export PDF/Excel
- Planification d'envoi
- Personnalisation

### Registres

**URL :** `/registres`

**Registres disponibles :**
- Registre des consultations
- Registre des admissions
- Registre des interventions
- Registre des décès

**Fonctionnalités :**
- Saisie manuelle
- Import/export
- Recherche avancée
- Archivage

---

## Fonctionnalités Avancées

### Recherche et Filtrage

**Critères de recherche :**
- Nom/prénom patient
- Numéro de dossier
- Date de consultation
- Spécialiste
- Diagnostic

**Filtres disponibles :**
- Période (jour, semaine, mois)
- Statut (en cours, terminé, annulé)
- Spécialité médicale
- Type de consultation

### Export de Données

**Formats supportés :**
- PDF pour les rapports
- Excel pour les données
- CSV pour l'analyse
- JSON pour l'intégration

**Données exportables :**
- Listes de patients
- Historique consultations
- Statistiques d'activité
- Rapports financiers

### Notifications Push

**Configuration :**
1. Accéder aux paramètres
2. Section "Notifications"
3. Activer les types souhaités
4. Définir les horaires
5. Sauvegarder les préférences

### Sauvegarde Automatique

**Fonctionnement :**
- Sauvegarde toutes les 5 minutes
- Indication visuelle de l'état
- Récupération en cas d'erreur
- Synchronisation multi-appareils

---

## Dépannage

### Problèmes de Connexion

**Erreur "Email ou mot de passe incorrect" :**
1. Vérifier la saisie des identifiants
2. Contrôler les majuscules/minuscules
3. Essayer de réinitialiser le mot de passe
4. Contacter l'administrateur système

**Page blanche après connexion :**
1. Vider le cache du navigateur
2. Désactiver les extensions
3. Essayer en navigation privée
4. Vérifier la connexion internet

### Problèmes de Performance

**Application lente :**
1. Fermer les onglets inutiles
2. Redémarrer le navigateur
3. Vérifier la connexion internet
4. Contacter le support technique

**Données non sauvegardées :**
1. Vérifier la connexion internet
2. Actualiser la page
3. Ressaisir les informations
4. Signaler le problème

### Erreurs Courantes

**"Accès refusé" :**
- Vérifier les permissions de votre rôle
- Contacter l'administrateur
- Vérifier la validité de votre session

**"Données non trouvées" :**
- Actualiser la page
- Vérifier les filtres appliqués
- Contrôler les critères de recherche


---

## Conclusion

Ce manuel couvre l'ensemble des fonctionnalités de l'application E-Sora Hôpital. Pour toute question supplémentaire ou formation personnalisée, n'hésitez pas à contacter notre équipe de support.

**Version du manuel :** 1.0  
**Dernière mise à jour :** Février 2026  
**Application version :** E-Sora Hôpital v2.0
# Module Calendrier

## Structure des Fichiers

```
components/@components/calendar/
├── CalendarPage.tsx       # Composant principal
├── CalendarToolbar.tsx    # Barre d'outils avec actions et navigation
├── CalendarView.tsx       # Vue du calendrier avec les événements
├── AddEventDialog.tsx     # Dialog d'ajout d'événement
├── EditEventSheet.tsx     # Sheet de modification d'événement
├── UpcomingEvents.tsx     # Liste des événements à venir
└── README.md             # Documentation
```

## Architecture et Flux de Données

### 1. Point d'Entrée (`CalendarPage.tsx`)

Le composant principal qui orchestre l'ensemble du module calendrier.

#### États Principaux
- `currentDate`: Date actuelle du calendrier
- `transactions`: Liste des transactions du mois
- `events`: Liste complète des événements
- `selectedEvent`: Événement sélectionné pour modification
- `isEditEventOpen`: État d'ouverture du sheet d'édition

#### Gestion des Événements
- Souscription aux changements Supabase pour les mises à jour en temps réel
- Gestion centralisée de l'édition des événements via `EditEventSheet`
- Nettoyage des états après modification (`selectedEvent` et `isEditEventOpen`)

### 2. Barre d'Outils (`CalendarToolbar.tsx`)

Gère la navigation et les actions rapides.

#### Fonctionnalités
- Navigation entre les mois
- Bouton "Aujourd'hui"
- Actions rapides :
  - Ajouter un événement
  - Ajouter une dépense
  - Ajouter un revenu

#### Props
```typescript
interface CalendarToolbarProps {
  currentDate: Date
  onDateChange: (date: Date) => void
  onTransactionAdded?: () => void
}
```

### 3. Vue Calendrier (`CalendarView.tsx`)

Affiche le calendrier et gère les interactions avec les événements.

#### États
- `selectedDate`: Date sélectionnée
- `events`: Liste des événements
- `isAddEventDialogOpen`: État du dialog d'ajout
- `isEditEventOpen`: État du sheet de modification
- `selectedEvent`: Événement en cours de modification

#### Interactions avec Supabase
1. Chargement des événements :
```typescript
const fetchEvents = async () => {
  const { data } = await supabase
    .from('events')
    .select(`
      id,
      title,
      description,
      location,
      start_date,
      end_date,
      start_time,
      frequency,
      created_by,
      participants (
        user (
          id,
          name,
          avatar
        )
      )
    `)
    .gte('start_date', startOfMonth(currentDate))
    .lte('start_date', endOfMonth(currentDate))
}
```

2. Suppression d'événement :
```typescript
const handleDeleteEvent = async (event: Event) => {
  // Suppression des participants
  await supabase
    .from('event_participants')
    .delete()
    .eq('event_id', event.id)
  
  // Suppression de l'événement
  await supabase
    .from('events')
    .delete()
    .eq('id', event.id)
}
```

### 4. Dialog d'Ajout (`AddEventDialog.tsx`)

Gère la création de nouveaux événements.

#### Schéma du Formulaire
```typescript
const formSchema = z.object({
  title: z.string().min(1, "Le titre est requis"),
  description: z.string().optional(),
  location: z.string().optional(),
  dateRange: z.object({
    from: z.date(),
    to: z.date().optional(),
  }),
  startTime: z.string().optional(),
  isFullDay: z.boolean().default(false),
  participants: z.array(z.string()).optional(),
})
```

#### Flux de Création
1. Saisie des informations
2. Validation du formulaire
3. Création de l'événement dans Supabase
4. Ajout des participants
5. Fermeture du dialog et rafraîchissement

### 5. Sheet de Modification (`EditEventSheet.tsx`)

Permet la modification d'un événement existant.

#### États
- `isLoading`: État du chargement
- `users`: Liste des utilisateurs disponibles
- `selectedParticipants`: Participants sélectionnés

#### Flux de Modification
1. Chargement des données initiales
2. Modification des champs
3. Soumission :
   - Mise à jour de l'événement
   - Suppression des anciens participants
   - Ajout des nouveaux participants
4. Fermeture du sheet et rafraîchissement

### 6. Composants

#### `UpcomingEvents.tsx`
- Affiche les événements à venir groupés par période
- Filtrage intelligent des événements :
  - Aujourd'hui
  - Demain
  - Cette semaine
  - Ce mois (uniquement les événements à venir)
  - Plus tard
- Affichage des plages de dates pour les événements multi-jours
- Intégration du bouton d'édition avec transition d'opacité

#### `CalendarView.tsx`
- Affichage du calendrier mensuel
- Intégration des événements et transactions
- Menu contextuel pour l'édition des événements
- Synchronisation avec le sheet d'édition

#### `EditEventSheet.tsx`
- Interface de modification des événements
- Gestion des callbacks :
  - `onOpenChange`: Gestion de l'état d'ouverture et nettoyage
  - `onSuccess`: Rafraîchissement des données et réinitialisation des états

## Flux de Modification d'un Événement

1. **Déclenchement**
   - Via `UpcomingEvents`: Clic sur le bouton d'édition
   - Via `CalendarView`: Clic sur l'événement ou menu contextuel

2. **Processus**
   ```typescript
   // Ouverture du sheet
   setSelectedEvent(event)
   setIsEditEventOpen(true)

   // Fermeture du sheet
   onOpenChange((open) => {
     setIsEditEventOpen(open)
     if (!open) {
       setSelectedEvent(null)
     }
   })

   // Après modification réussie
   onSuccess(() => {
     setIsEditEventOpen(false)
     setSelectedEvent(null)
     fetchEvents()
   })
   ```

3. **Mise à jour**
   - Rafraîchissement automatique via Supabase realtime
   - Mise à jour manuelle via `fetchEvents()`
   - Propagation des changements à tous les composants

## Structure de la Base de Données (Supabase)

### Tables Principales

1. `events`
```sql
create table events (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  location text,
  start_date date not null,
  end_date date,
  start_time time,
  frequency text check (frequency in ('once', 'daily', 'weekly', 'monthly', 'yearly')),
  created_by uuid references auth.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now())
);
```

2. `event_participants`
```sql
create table event_participants (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid references events(id) on delete cascade,
  user_id uuid references auth.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()),
  unique(event_id, user_id)
);
```

## Gestion des États

### Cycle de Vie des Événements

1. **Création**
   - Validation des données
   - Insertion dans `events`
   - Ajout des participants dans `event_participants`

2. **Modification**
   - Mise à jour dans `events`
   - Suppression/ajout des participants

3. **Suppression**
   - Suppression en cascade des participants
   - Suppression de l'événement

## Bonnes Pratiques

1. **Gestion d'État**
   - État centralisé dans `CalendarPage`
   - Nettoyage systématique des états temporaires
   - Utilisation de callbacks pour la synchronisation

2. **Performance**
   - Filtrage côté client pour les événements à venir
   - Souscription Supabase pour les mises à jour en temps réel
   - Optimisation des re-rendus avec `useCallback`

3. **UX**
   - Transitions fluides pour les interactions
   - Feedback visuel immédiat
   - Cohérence dans l'affichage des dates et heures

4. **Maintenance**
   - Structure modulaire
   - Types stricts pour les props et données
   - Documentation des flux de données

## Développements Futurs

1. **Améliorations Possibles**
   - Support des événements récurrents
   - Vue semaine/jour
   - Gestion des fuseaux horaires
   - Notifications pour les participants

2. **Points d'Attention**
   - Gestion des conflits d'événements
   - Performance avec beaucoup d'événements
   - Synchronisation en temps réel 
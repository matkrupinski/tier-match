# 🎮 Tier Match - Multiplayer Party Game (MVP)

Architektura i implementacja przeglądarkowej gry imprezowej w czasie rzeczywistym opartej na układaniu i odgadywaniu rankingów tier list (od poziomu **S** do **D**).

---

## 🌟 1. Koncepcja Rozgrywki

1. **Wybór Twórcy:** W każdej rundzie jeden z graczy staje się **Twórcą Tier Listy** (rola przekazywana w systemie rotacyjnym Round-Robin).
2. **Losowa Kategoria:** Pokój losuje kategorię imprezową (np. *„Napoje na imprezę”*, *„Klasyki gier ze znajomymi”*, *„Ikony popkultury na bezludnej wyspie”*) oraz 6–8 unikalnych elementów.
3. **Układanie w Tajemnicy (CREATING):** Twórca w tajemnicy rozmieszcza elementy w poziomach `S`, `A`, `B`, `C`, `D` na swoim ekranie.
4. **Zgadywanie (GUESSING):** Wszyscy pozostali gracze równolegle próbują odgadnąć gust i wybory Twórcy, przeciągając te same elementy do odpowiadających im tierów.
5. **Wielkie Odsłonięcie (REVEAL):** Po upływie czasu następuje animowane odsłonięcie oficjalnych wyborów Twórcy wraz z wyliczeniem punktów za trafienia.
6. **Tabela Wyników (SCOREBOARD):** Prezentacja podium, sumarycznych punktów i przejście do kolejnej rundy.

---

## 🧮 2. Matematyka i Logika Punktacji

Dla każdego z $N$ elementów, niech:
- $T_{creator} \in \{ S: 4, A: 3, B: 2, C: 1, D: 0 \}$
- $T_{guesser} \in \{ S: 4, A: 3, B: 2, C: 1, D: 0 \}$
- Różnica bezwzględna poziomów: $d = |T_{creator} - T_{guesser}|$

$$Punkty = \begin{cases} 
3 & \text{dla } d = 0 \quad (\text{idealne trafienie w ten sam tier}) \\ 
1 & \text{dla } d = 1 \quad (\text{pomyłka o dokładnie 1 tier, np. S vs A}) \\ 
0 & \text{dla } d \ge 2 \quad (\text{pomyłka o 2 lub więcej poziomów}) 
\end{cases}$$

> *Uwaga:* Jeżeli gracz nie zdąży przypisać elementu (pozostanie w ławce rezerwowych), otrzymuje 0 punktów za dany element.

---

## 🛡️ 3. Architektura Autorytatywna i Anti-Cheat

Najczęstszym błędem w grach imprezowych jest wysyłanie pełnego stanu gry do frontendu i poleganie na ukrywaniu go w CSS/React (`display: none`). W Tier Match serwer jest **w 100% autorytatywny**:

1. **Izolacja Pamięci Serwera:** Wybory Twórcy trafiają do `ServerRoom.secretCreatorPlacement`.
2. **Funkcja Sanityzacji (`sanitizeRoomState`):**
   - Podczas faz `LOBBY`, `CREATING` i `GUESSING` pole `revealedCreatorPlacement` jest wysyłane jako `null`.
   - Zgadujący otrzymują wyłącznie informację `hasSubmitted: boolean` o oponentach.
   - Nawet inspekcja ramek WebSocket w Chrome DevTools / Network tab **nie pozwala podejrzeć wyborów Twórcy przed fazą REVEAL**.
3. **Bezpieczne Odsłonięcie:** Dopiero po zakończeniu odliczania lub zatwierdzeniu typów przez wszystkich graczy, serwer przechodzi do `REVEAL`, kalkuluje punkty i rozsyła `revealedCreatorPlacement` oraz `roundResults`.

---

## 📡 4. Protokół Zdarzeń WebSocket

### Zdarzenia Klient ➡️ Serwer (`ClientToServerEvents`)
| Zdarzenie | Payload | Opis |
| :--- | :--- | :--- |
| `room:create` | `{ playerName: string, avatarUrl?: string }` | Założenie nowego pokoju przez Hosta |
| `room:join` | `{ roomCode: string, playerName: string, avatarUrl?: string }` | Dołączenie do istniejącego pokoju |
| `game:start` | *(brak)* | Wystartowanie rozgrywki (Host) |
| `placement:draft` | `{ placement: TierPlacement }` | Auto-save szkicu ułożenia kafelków |
| `creator:submit` | `{ placement: TierPlacement }` | Ostateczne zatwierdzenie listy przez Twórcę |
| `guesser:submit` | `{ placement: TierPlacement }` | Ostateczne zatwierdzenie typów przez Zgadującego |
| `game:next_round` | *(brak)* | Przejście do następnej rundy (Host) |

### Zdarzenia Serwer ➡️ Klient (`ServerToClientEvents`)
| Zdarzenie | Payload | Opis |
| :--- | :--- | :--- |
| `sync:state` | `ClientGameState` | Zsanitizowany stan pokoju dla danego socketu |
| `room:joined` | `{ playerId: string, roomCode: string }` | Potwierdzenie rejestracji w pokoju |
| `timer:tick` | `number` | Liczba sekund pozostała do końca obecnej fazy |
| `phase:changed` | `{ phase: RoomPhase, timeLimit: number }` | Zmiana stanu maszyny pokoju |
| `reveal:started` | `{ revealedCreatorPlacement, results }` | Inicjalizacja odsłonięcia wyników |
| `game:error` | `{ message: string }` | Komunikat o błędzie biznesowym |

---

## ⚙️ 5. Maszyna Stanów Pokoju

```
 ┌──────────┐
 │  LOBBY   │  ◄── Min. 2 graczy, kod pokoju, lista oczekujących
 └────┬─────┘
      │ game:start
      ▼
 ┌──────────┐
 │ CREATING │  ◄── Twórca układa tier listę (45s). Sekret na serwerze.
 └────┬─────┘
      │ creator:submit LUB timer = 0
      ▼
 ┌──────────┐
 │ GUESSING │  ◄── Zgadujący dopasowują elementy (40s).
 └────┬─────┘
      │ all submitted LUB timer = 0
      ▼
 ┌──────────┐
 │  REVEAL  │  ◄── Autorytatywna kalkulacja (+3, +1, 0 pkt), animacja odsłonięcia (15s).
 └────┬─────┘
      │ timer = 0
      ▼
 ┌────────────┐
 │ SCOREBOARD │ ──► Host klika "Następna runda" ──► Powrót do CREATING (nowy Twórca)
 └────────────┘
```

---

## 💻 6. Uruchomienie Projektu

### Wymagania:
- Node.js (wersja >= 18.x)
- npm, pnpm lub yarn

### Krok po kroku:

```bash
# 1. Instalacja zależności
npm install

# 2. Uruchomienie frontendu i backendu w trybie deweloperskim
npm run dev
```

Po uruchomieniu:
- **Frontend (Next.js):** [http://localhost:3000](http://localhost:3000)
- **Serwer WebSocket (Socket.io):** [http://localhost:4000](http://localhost:4000)
- **Healthcheck serwera:** [http://localhost:4000/health](http://localhost:4000/health)

Możesz otworzyć grę w dwóch oknach przeglądarki (lub w oknie prywatnym), aby przetestować interakcję multiplayer pomiędzy Twórcą a Zgadującym w czasie rzeczywistym!

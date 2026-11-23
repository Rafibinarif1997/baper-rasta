# Baper Rasta — Gameplay & Technical Notes

## Current build
This is a browser-playable single-player prototype. The selected camera follows the player through a 2D city. The player can move using touch or keyboard controls, pick up marked passengers, earn fares, visit shops, buy rickshaw upgrades, and trigger the local police chase/fine loop.

## Economy values (prototype tuning)
- Starting cash: ৳50
- Passenger fare: ৳25–৳60, with a small upgrade bonus
- Tea: ৳10
- Rice meal: ৳35
- Rickshaw upgrade: ৳100, increasing by ৳100 each time
- Sleep / next day household cost: ৳60

These are test values and can be balanced after playtesting.

## Save data
The prototype stores local progress in browser localStorage under `baper-rasta-local-v1`. Clearing browser data resets progress. This is not account sync and can be edited by the player; never use it as a trusted multiplayer balance.

## Multiplayer boundary
No Supabase keys, project URL, authentication, database, realtime channels or server functions are configured. The app must not claim online multiplayer until the backend is implemented and tested.

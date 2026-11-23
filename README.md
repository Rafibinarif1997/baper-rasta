# Baper Rasta — বাপের রাস্তা

A mobile-first 2D Bangladeshi rickshaw-life game prototype with a follow camera.

## Play
Open the GitHub Pages site after enabling Pages from **Settings → Pages → Deploy from a branch → main → /(root)**.

## Current playable features
- Follow-camera city exploration with touch controls and keyboard controls.
- Rickshaw-style player character, procedural Dhaka-inspired streets and buildings.
- Passenger pickup and fare earning.
- Tea stall, rice hotel, home and rickshaw garage interactions.
- Battery drain and passive recharge.
- Rickshaw speed/battery upgrades purchased with in-game money.
- Daily home/upkeep loop and family condition meter in saved game state.
- Wanted stars, a pursuing police officer and fine when caught.
- Local browser save using localStorage (single-device only).

## Controls
- Mobile: directional pad + action button.
- Desktop: WASD or arrow keys to move; E or Space to interact.
- Horn button / on-screen horn for feedback.

## Technology
- Phaser 3 loaded from jsDelivr CDN.
- Vanilla JavaScript and CSS.
- GitHub Pages for static hosting.
- LocalStorage for temporary local progress.

## Not implemented yet
Supabase is intentionally not connected. Online accounts, server-side economy, real multiplayer synchronization, player-to-player interaction, elections and weekly association dues require a backend and are future milestones. The current police and economy systems are a local prototype, not secure online systems.

## Next development milestones
1. Polish map, collision, character and rickshaw art.
2. Add passenger routes, traffic, collisions, sound and missions.
3. Add Supabase authentication, database and realtime multiplayer.
4. Add server-authoritative economy, association elections and moderation tools.
# DREAMO

Design your dream house in 3D. Draw the walls, add doors and windows, paint, fill it with furniture and a garden, pick a place (beach, forest, snowy mountain or city), and then walk inside.

**Play it:** https://texasboots.github.io/dreamo/

## Your houses

Houses save by themselves in your browser, on your own computer. Updates to DREAMO don't touch them.

To keep a backup, or to move houses to another computer or browser, use **💾 Save all to a file** on the My Houses page. Use **📂 Open house file** to bring them back.

## Run it on this computer

```bash
python3 -m http.server 5173
```

Then open http://localhost:5173. Houses saved there are kept apart from the ones on the website. Use a house file to move them between the two.

`tests.html` runs the checks for the room and wall maths.

Made with [Three.js](https://threejs.org) (in `vendor/three`, MIT licence).

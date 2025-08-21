# Info
You can use this version in local development in web version Matrix Element
# Add widget in chat
/addwidget https://m-stickers.loc:5173/?roomId=$matrix_room_id&matrix_room_id=$matrix_room_id&widgetId=$matrix_widget_id
# Run vite
pnpm run dev --host=m-stickers.loc
It will run with https for except mixed content problem.
Warning: visit host first for accept self-signed certificate

# Other
...

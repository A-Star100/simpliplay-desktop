js="main.js"
# set devtools to false in webPreferences
sed -i '102s/$/, \n    devTools: false,/' $js
# delete separator and inspect btn
sed -i '147,148d'

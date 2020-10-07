
var layerRef = app.activeDocument.layerSets;
for(var i = 0; i < layerRef.length; i++)
{
    alert(layerRef[i].name);
}
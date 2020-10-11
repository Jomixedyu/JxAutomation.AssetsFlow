Path = new Object();
Path.getFileNameExt = function(path) {
    if (path.indexOf('.') != -1) {
        var index = path.lastIndexOf('.');
        return path.substring(index + 1).toLowerCase();
    }
    return path;
}
Path.getDirectoryName = function(path) {
    if (path.indexOf('/') != -1) {
        var index = path.lastIndexOf('/');
        return path.substring(0, index);
    }
    return path;
}
Path.prepare = function(path) {
    var folder = Folder(path);
    if(!folder.exists) {
        folder.create();
    }
}

function Size(width, height) {
    this.width = width;
    this.height = height;
}
Size.prototype.toString = function() {
    return "{width: " + this.width + ", height: " + this.height + "}";
}

function parseSize(str) {
    var index = str.indexOf('x');
    if (index == -1) {
        return null;
    }
    var arr = str.split('x');
    if (arr.length != 2) {
        return null;
    }
    return new Size(arr[0], arr[1]);
}


function Point(x, y) {
    this.x = x;
    this.y = y;
}
Point.prototype.toString = function(){
    return "{x: " + this.x + ", y: " + this.y + "}";
}

function Transform() {
    this.size = null;
    this.localtion = null;
    this.bounds = null;
}

function PropertyInfo(isExport, isCut, cutSize, tag, quality, filename) {
    //Boolean
    this.isExport = isExport;
    //Boolean
    this.isCut = isCut;
    //Size
    this.cutSize = cutSize;
    //String
    this.tag = tag;
    //Number
    this.quality = quality;
    //String
    this.filename = filename;
    //String
    this.errMsg = null;
}

function createPropertyInfo() {
    return new PropertyInfo(false, false, null, null, 5, null);
}

function ExportLayerInfo() {
    this.layer = layer;
    this.path = path;
    this.propertyInfo = propertyInfo;
}


function isKey(c) {
    switch (c) {
        case '@':
        case '|':
        case '#':
        case ':':
            return true;
    }
    return false;
}

function getLayerTransform(layer) {
    var bounds = layer.bounds;
    var x1 = bounds[0].value;
    var y1 = bounds[1].value;
    var x2 = bounds[2].value;
    var y2 = bounds[3].value;
    var transform = new Transform();
    transform.size = new Size(x2 - x1, y2 - y1);
    transform.localtion = new Point(x1, y1);
    transform.bounds = bounds;
    return transform;
}


function parseName(artLayerName) {
    if (artLayerName[0] != '@') {
        return null;
    }
    var info = createPropertyInfo();
    var colonIndex = artLayerName.lastIndexOf(':');
    if (colonIndex == -1) {
        throw artLayerName + " 不符合规范。";
    }

    for (var i = 1; i < artLayerName.length; i++) {
        switch (artLayerName[i]) {
            case '|':
                info.isCut = true;
                if (artLayerName.length > i + 1 && !isKey(artLayerName[i + 1])) {
                    var index = 0;
                    for (index = i + 1; !isKey(artLayerName[index]); index++) {};
                    info.cutSize = parseSize(artLayerName.substring(i, index - 1));
                    i = index - 1;
                }
                break;
            case '$':
                var param = artLayerName[i + 1];
                if (artLayerName.length > i + 1 && !isKey(param)) {
                    info.quality = parseInt(param);
                }
                i++;
                break;
            case '#':
                var index = 0;
                for (index = i + 1; artLayerName[index] != ';'; index++) {
                    if (artLayerName.length > i + 1) {
                        throw artLayerName + " TAG意外的结束";
                    }
                    if (artLayerName[index] == '\\') {
                        index++;
                        continue;
                    }
                }
                info.tag = artLayerName.substring(i + 1, index - 1);
                i = index - 1;
                break;
            case ':':
                var index = i;
                while (true) {
                    index++;
                    if (artLayerName.length < index + 1) {
                        break;
                    }

                }
                info.filename = artLayerName.substring(i + 1, index);
                i = index;
                break;
        }

    }
    return info;
}

function checkLayerValidity(layer) {
    var rst = parseName(layer.name);
    if (rst == null) {
        return true;
    } else {
        return rst.errMsg != null;
    }
}


function getDocumentTypeByExt(ext) {
    switch (ext.toLowerCase()) {
        case "jpg":
        case "jpeg":
            return SaveDocumentType.JPEG;
        case "png":
            return SaveDocumentType.PNG;
        case "bmp":
            return SaveDocumentType.BMP;
        case "tga":
            return SaveDocumentType.TARGA;
        default:
            break;
    }
}

function saveDocument(document, filename, quality) {
    var file = new File(filename);
    var exportOption = new ExportOptionsSaveForWeb();
    exportOption.PNG8 = false;
    exportOption.quality = (quality + 1) * 10;
    exportOption.format = getDocumentTypeByExt(Path.getFileNameExt(filename))
    document.exportDocument(file, ExportType.SAVEFORWEB, exportOption);
}
function hideArtLayer(artLayer)
{
    artLayer.visible = false;
}
function hideLayerSet(layerSet)
{
    var layers = layerSet.layers;
    for(var index = 0; index < layers.length; index++)
    {
        var item = layers[index];
        if(item.typename == "ArtLayer")
        {
            hideArtLayer(item);
        }
        else if(item.typename == "LayerSet")
        {
            hideLayerSet(item);
        }
    }
}
function hideLayer(layer)
{
    if(layer.typename == "ArtLayer")
    {
        hideArtLayer(layer);
    }
    else if(layer.typename == "LayerSet")
    {
        hideLayerSet(layer);
    }
}
function hideAllLayer(document)
{
    var layers = document.layers;
    for(var index = 0; layers.length; index++)
    {
        var item = layers[index];
        hideLayer(item);
    }
}

function exportLayer(document, layer) {

    if(!layer.visible)
    {
        return;
    }
    var transform = getLayerTransform(layer);
    var propInfo = parseName(layer.name);
    if(propInfo.cutSize == null)
    {
        propInfo.cutSize = transform.size;
    }

    var exportFolder = "~/Desktop/Assets_" + document.name + "/"
    Path.prepare(exportFolder);
    var dupDoc = document.duplicate();
    hideAllLayer(dupDoc);
    
    // dupDoc.trim(TrimType.TRANSPARENT);
    dupDoc.crop(transform.bounds, 0);
    saveDocument(dupDoc, exportFolder + propInfo.filename, propInfo.quality);
    dupDoc.close(SaveOptions.DONOTSAVECHANGES);

}

function main() {

    // var strArr = new Array();
    // exportLayer(app.activeDocument.layers, strArr)

    var document = app.activeDocument;
    var exportFolder = "~/Desktop/" + document.name + "/"
    // saveDocument(document, exportFolder + document.activeLayer.name);
    // try {
    //     var rst = parseName(document.activeLayer.name);
    //     if (rst == null) {
    //         alert("不是");
    //     } else {
    //         alert("isCut: " + rst.isCut);
    //         if (rst.isCut) {
    //             alert(rst.cutSize.toString());
    //         }
    //         alert("tag: " + rst.tag);
    //         alert("filename: " + rst.filename);
    //     }

    // } catch (x_x) {
    //     alert(x_x);
    // }

    exportLayer(document, document.activeLayer);

    // alert(Path.getDirectoryName(app.activeDocument.fullName));
    alert("done");
}
main();
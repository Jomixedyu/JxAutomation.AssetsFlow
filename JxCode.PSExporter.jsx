#target Photoshop

/*class Path*/
function Path_getFileNameExt(path) {
    if (path.indexOf('.') != -1) {
        var index = path.lastIndexOf('.');
        return path.substring(index + 1).toLowerCase();
    }
    return path;
}
function Path_getDirectoryName(path) {
    if (path.indexOf('/') != -1) {
        var index = path.lastIndexOf('/');
        return path.substring(0, index);
    }
    return path;
}
function Path_prepare(path) {
    var folder = Folder(path);
    if(!folder.exists) {
        folder.create();
    }
}
/*class Size*/
function Size(width, height) {
    this.width = width;
    this.height = height;
}
Size.prototype.toString = function() {
    return "{width: " + this.width + ", height: " + this.height + "}";
}
Size.prototype.toXMLString = function(sizeName) {
    if(typeof sizeName == "undefined" || sizeName == null) {
        sizeName = "Size";
    }

    return "<" + sizeName + " width=\"" + this.width + "\" height=\"" + this.height + "\" />";
}

function Size_parse(str) {
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

/*class Point*/
function Point(x, y) {
    this.x = x;
    this.y = y;
}
Point.prototype.toString = function(){
    return "{x: " + this.x + ", y: " + this.y + "}";
}
Point.prototype.toXMLString = function(name) {
    if(typeof name == "undefined" || name == null) {
        name = "Point";
    }
    return "<" + name + " x=\"" + this.x + "\" y=\"" + this.y + "\" />";
}
/*class Transform*/
function Transform() {
    this.size = null;
    this.location = null;
    this.bounds = null;
}

// class LayerNameInfo
function LayerNameInfo(isExport, isCut, cutSize, tag, quality, filename) {
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
    this.isExtern = false;
    //String
    this.type = null;
}
LayerNameInfo.prototype.toString = function() {
    var arr = new Array();
    arr.push("isExport: " + this.isExport);
    arr.push("filename: " + this.filename);
    arr.push("isCut: " + this.isCut);
    arr.push("cutSize: " + (this.cutSize == null ? null : this.cutSize.toString()));
    arr.push("tag: " + this.tag);
    arr.push("quality: " + this.quality);
    arr.push("isExtern: " + this.isExtern);
    arr.push("type: " + this.type);
    return arr.join(", ");
}
function LayerNameInfo_create() {
    var rtn = new LayerNameInfo(false, false, null, null, 5, null);
    return rtn;
}
function LayerMetaInfo_FontInfo() {
    this.fontName = null;
    this.fontSize = 0;
    this.enableBold = false;
}
// class LayerMetaInfo
function LayerMetaInfo() {
    this.opacity = 0;
    this.location = new Point(0, 0);
    this.order = 0;
}
LayerMetaInfo.prototype.toString = function() {
    return "{location: " + this.location.toString() + ", order: " + this.order;
}

// class ExportLayerInfo
function ExportLayerInfo() {
    this.layer = null;
    this.path = null;
    this.layerNameInfo = null;
    this.layerMetaInfo = null;
}



// class LayerName
var LayerName_END     = ';';

var LayerName_EXPORT  = '@';
var LayerName_EXTERN  = '~';
var LayerName_CUT     = '|';
var LayerName_QUALITY = '$';
var LayerName_TAG     = '#';
var LayerName_TYPE    = '?';

/* class LayerName_NameInfo*/
function LayerName_NameInfo(propertyInfo, propertyType, name, position) {
    this.propertyInfo = propertyInfo;
    this.propertyType = propertyType;
    this.name = name;
    this.position = position;
}
//return SavedocumentType
function LayerName_getTypeByExt(ext) {
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
function LayerName_isExport(name) {
    return name[0] == LayerName_EXPORT || name[0] == LayerName_EXTERN;
}
function LayerName_getCharType(c) {
    switch(c) {
        case LayerName_EXPORT:
            return LayerName_EXPORT;
        case LayerName_CUT:
            return LayerName_CUT;
        case LayerName_QUALITY:
            return LayerName_QUALITY;
        case LayerName_TAG:
            return LayerName_TAG;
        case LayerName_EXTERN:
            return LayerName_EXTERN;
        case LayerName_TYPE:
            return LayerName_TYPE;
    }
    return null;
}
function LayerName_isDigit(c) {
    var num = c.charCodeAt(0);
    return num >= 48 && num <= 57
}

function LayerName_getProperty(name, index) {
    var propertyType = LayerName_getCharType(name[index]);
    if(propertyType == null) {
        return null;
    }

    var nameInfo = new LayerName_NameInfo(null, null, null, 0);
    nameInfo.propertyType = propertyType;
    nameInfo.name = name;

    switch(propertyType) {
        case LayerName_EXTERN:
        case LayerName_EXPORT:
            var startIndex = index++;
            var offset = 0;
            while(index < name.length) {
                if(name[index] == LayerName_END) {
                    offset = -1;
                    index++;
                    break;
                }
                index++;
            }
            nameInfo.position = index;
            if(startIndex != index-1) {
                nameInfo.propertyInfo = name.substring(startIndex + 1, index + offset);
            }
            break;
        case LayerName_CUT:
            var startIndex = index++;
            var isRect = false;
            while(index < name.length) {
                if(LayerName_isDigit(name[index])) {
                    index++;
                } else if(name[index] == 'x') {
                    index++;
                    if(isRect) {
                        break;
                    } else {
                        isRect = true;
                    }
                } else {
                    break;
                }
                
            }
            if(startIndex != index - 1) {
                nameInfo.propertyInfo = name.substring(startIndex + 1, index);
                if(!isRect) {
                    nameInfo.propertyInfo = nameInfo.propertyInfo + "x" + nameInfo.propertyInfo;
                }
            }
            nameInfo.position = index;
            break;
        case LayerName_QUALITY:
            var startIndex = index++;
            
            //最后一个属性标记或者下一个字符是数字
            if(index < name.length && LayerName_isDigit(name[index])) {
                //数字
                nameInfo.propertyInfo = name[index];
                index++;
            }
            nameInfo.position = index;
            break;
        case LayerName_TYPE:
        case LayerName_TAG:
            var startIndex = index++;
            var sb = new Array();
            var offset = 0;
            while(index < name.length) {
                if(name[index] == '\\') {
                    index++;
                } else if(name[index] == ';') {
                    index++;
                    offset = -1;
                    break;
                }
                sb.push(name[index]);
                index++;
            }
            if(startIndex != index - 1) {
                nameInfo.propertyInfo = sb.join('');
            }
            nameInfo.position = index;
            break;

    }
    return nameInfo;
}


function XML_head() {
    return "<?xml version=1.0 encoding=\"UTF-8\"?>";
}
function XML_getLayer(layer, order) {
    var nameInfo = Layer_getNameInfo(layer);
    
    var xml;

    if(layer.typename == "ArtLayer" || (layer.typename == "LayerSet" && nameInfo.isExport)) {
        if(!nameInfo.isExport) {
            return null;
        }

        xml = new XML("<ArtLayer></ArtLayer>");

        xml.@Name = nameInfo.filename;
        xml.@IsCut = nameInfo.isCut;
        xml.@Quality = nameInfo.quality;
        xml.@Order = order;
        xml.@IsExtern = nameInfo.isExtern;

        var trans = Layer_getTransform(layer);
        xml.appendChild(new XML(trans.location.toXMLString("Location")));
        xml.appendChild(new XML(trans.size.toXMLString("Size")));

        if(nameInfo.isCut) {
            xml.appendChild(new XML(nameInfo.cutSize.toXMLString("CutSize")));
        }
        if(nameInfo.type != null) {
            xml.appendChild(new XML("<Type>"+nameInfo.type+"</Type>"));
        }
        if(nameInfo.tag != null) {
            xml.appendChild(new XML("<Tag>"+nameInfo.tag+"</Tag>"));
        }
    } else if (layer.typename == "LayerSet") {
        xml = new XML("<LayerSet></LayerSet>");
        for(var i = 0; i < layer.layers.length; i++) 
        {
            var _xml = XML_getLayer(layer.layers[i], i);
            if(_xml != null) {
                xml.appendChild(_xml);
                xml.@Name = nameInfo.filename;
                
            } else {
                continue;
            }
        }
    }

    return xml;
}

function XML_exportDocument(document) {
    var width = document.width.as("px");
    var height = document.height.as('px');
    var xml = new XML("<Document Name=\"" + document.name + "\" Width=\"" + width + "\" Height=\"" + height + "\"></Document>");

    var layers = document.layers;
    
    for(var i = 0; i < layers.length; i++) {
        var _xml = XML_getLayer(layers[i], i);
        if(_xml != null) {
            xml.appendChild(_xml);
        }
    }
    return xml;
}

//class Layer
function Layer_getTransform(layer) {
    var bounds = layer.bounds;
    var x1 = bounds[0].as("px");
    var y1 = bounds[1].as("px");
    var x2 = bounds[2].as("px");
    var y2 = bounds[3].as("px");
    var transform = new Transform();
    transform.size = new Size(x2 - x1, y2 - y1);
    transform.location = new Point(x1, y1);
    transform.bounds = bounds;
    return transform;
}
function Layer_hideArt(artLayer)
{
    artLayer.visible = false;
}
function Layer_hideLayerSet(layerSet)
{
    var layers = layerSet.layers;
    for(var index = 0; index < layers.length; index++)
    {
        var item = layers[index];
        if(item.typename == "ArtLayer")
        {
            Layer_hideArt(item);
        }
        else if(item.typename == "LayerSet")
        {
            Layer_hideArt(item);
        }
    }
}
function Layer_hide(layer)
{
    if(layer.typename == "ArtLayer")
    {
        Layer_hideArt(layer);
    }
    else if(layer.typename == "LayerSet")
    {
        Layer_hideLayerSet(layer);
    }
}
function Layer_hideAll(document)
{
    var layers = document.layers;
    for(var index = 0; layers.length; index++)
    {
        var item = layers[index];
        Layer_hide(item);
    }
}

// 循环取出图层名中的多个属性并进行预制处理
//return LayerNameInfo
function Layer_getNameInfo(layer) {
    var layerInfo = LayerNameInfo_create();
    var index = 0;
    var prop = null;
    while((prop = LayerName_getProperty(layer.name, index)) != null) {
        switch(prop.propertyType) {
            case LayerName_EXTERN:
                layerInfo.isExtern = true;
                layerInfo.isExport = true;
                layerInfo.filename = prop.propertyInfo;
                break;
            case LayerName_EXPORT:
                layerInfo.isExport = true;
                layerInfo.filename = prop.propertyInfo;
                break;
            case LayerName_CUT:
                layerInfo.isCut = true;
                if(prop.propertyInfo != null) {
                    layerInfo.cutSize = Size_parse(prop.propertyInfo);
                } else {
                    var trans = Layer_getTransform(layer);
                    layerInfo.cutSize = trans.size;
                }
                break;
            case LayerName_QUALITY:
                if(prop.propertyInfo != null) {
                    layerInfo.quality = parseInt(prop.propertyInfo);
                }
                break;
            case LayerName_TAG:
                layerInfo.tag = prop.propertyInfo;
                break;
            case LayerName_TYPE:
                layerInfo.type = prop.propertyInfo;
                break;
        }
        index = prop.position;
    }
    if(layerInfo.filename == null) {
        layerInfo.filename = layer.name;
    }
    return layerInfo;
}
//return LayerMetaInfo
function Layer_getMetaInfo(layer) {
    var metaInfo = new LayerMetaInfo();
    var trans = Layer_getTransform(layer);
    metaInfo.location = trans.location;
    metaInfo.opacity = layer.opacity;
    var layers = layer.parent.layers;

    var idx = -1;
    for(var i = 0; i < layers.length; i++) {
        if(layers[i] == layer) {
            idx = i;
            break;
        }
    }

    metaInfo.order = idx;
    return metaInfo;
}

//TODO
function Layer_exportLayer(document, layer) {

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

/*class Document*/
function Document_save(document, filename, quality) {
    var file = new File(filename);
    var exportOption = new ExportOptionsSaveForWeb();
    exportOption.PNG8 = false;
    exportOption.quality = (quality + 1) * 10;
    exportOption.format = getDocumentTypeByExt(Path.getFileNameExt(filename));
    document.exportDocument(file, ExportType.SAVEFORWEB, exportOption);
}

function main() {

    var document = app.activeDocument;
    var exportFolder = "~/Desktop/" + document.name + "/";

    var xml = XML_exportDocument(document);
    alert(xml);


}
main();
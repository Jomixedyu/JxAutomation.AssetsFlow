#target Photoshop

var DEFAULT_EXPORT_WORKSPACE = "~/Desktop";
var DEFAULT_QUALITY = 8;
var DEFAULT_EXPORT_EXT = ".png";

/*class Path*/
function Path_getFileNameExt(path) {
    if (path.indexOf('.') != -1) {
        var index = path.lastIndexOf('.');
        return path.substring(index + 1).toLowerCase();
    }
    return null;
}
function Path_getFileName(path) {
    var path = path.replace("\\", "/");
    var index = path.lastIndexOf('/');
    if(index == -1) {
        return path;
    }
    return path.substring(index + 1)
}
function Path_getFileNameWithoutExt(path) {
    varpath = Path_getFileName(path);
    var index = path.lastIndexOf('.');
    if(index == -1) {
        return path;
    }
    return path.substring(0, index);
}
function Path_getDirectoryName(path) {
    var path = path.replace("\\", "/");
    if (path.indexOf('/') != -1) {
        var index = path.lastIndexOf('/');
        return path.substring(0, index);
    }
    return path;
}
function Path_prepareExt(path) {
    if (Path_getFileNameExt(path) != null) {
        return path;
    }
    return path + DEFAULT_EXPORT_EXT;
}

function Path_prepare(path) {
    var folder = Folder(path);
    if(!folder.exists) {
        folder.create();
    }
}
//如果文档有存档则返回相同的目录，如果没有则返回桌面目录
function Path_writablePath(document) {
    if(typeof document == "undefined" || document == null) {
        return DEFAULT_EXPORT_WORKSPACE;
    } else {
        try{
            return Path_getFileNameWithoutExt(document.fullName.fullName) + "_Assets";
        } catch(e) {
            alert(e)
            return DEFAULT_EXPORT_WORKSPACE
        }
    }
}
/*class Size*/
function Size(width, height) {
    this.width = width;
    this.height = height;
}
Size.prototype.equals = function(target) {
    return this.width == target.width && this.height == target.height;
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
function Transform_parseBounds(bounds) {
    var ltx = Math.floor(bounds[0].as("px"));
    var lty = Math.floor(bounds[1].as("px"));
    var rbx = Math.floor(bounds[2].as("px"));
    var rby = Math.floor(bounds[3].as("px"));
    var transform = new Transform();
    transform.size = new Size(rbx - ltx, rby - lty);
    transform.location = new Point(ltx, lty);
    transform.bounds = bounds;
    return transform;
}
// class LayerNameInfo
function LayerNameInfo() {
    this.isExport = false;
    this.isExportPic = false;

    this.isExtern = false;
    this.isCut = false;
    this.cutSize = null;
    this.tag = null;
    this.quality = DEFAULT_QUALITY;
    this.filename = null;
    this.type = null;
    this.isFormat = false;
    this.layerType = null;
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

//用Size去变换一个Bounds
function resizeBoundsBySize(bounds, size) {
    var trans = Transform_parseBounds(bounds);
    var xOffset = (size.width - trans.size.width) / 2;
    var yOffset = (size.height - trans.size.height) / 2;
    var arr = new Array();
    arr.push(UnitValue(bounds[0].as("px") - xOffset, "px"));
    arr.push(UnitValue(bounds[1].as("px") - yOffset, "px"));
    arr.push(UnitValue(bounds[2].as("px") + xOffset, "px"));
    arr.push(UnitValue(bounds[3].as("px") + yOffset, "px"));
    return arr;
}


// class LayerName
var LayerName_END     = ';';

var LayerName_EXPORTPIC  = '@';
var LayerName_EXTERN  = '~';
var LayerName_GROUPPROP = ">";

var LayerName_CUT     = '|';
var LayerName_QUALITY = '$';
var LayerName_TAG     = '#';
var LayerName_TYPE    = '?';
var LayerName_FORMAT  = "&";


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
            throw "未知文件格式"
            break;
    }
}
function LayerName_isExport(name) {
    return name[0] == LayerName_EXPORTPIC || name[0] == LayerName_EXTERN;
}
function LayerName_getCharType(c) {
    switch(c) {
        case LayerName_EXPORTPIC:
            return LayerName_EXPORTPIC;
        case LayerName_EXTERN:
            return LayerName_EXTERN;
        case LayerName_GROUPPROP:
            return LayerName_GROUPPROP;

        case LayerName_CUT:
            return LayerName_CUT;
        case LayerName_QUALITY:
            return LayerName_QUALITY;
        case LayerName_TAG:
            return LayerName_TAG;
        case LayerName_TYPE:
            return LayerName_TYPE;
        case LayerName_FORMAT:
            return LayerName_FORMAT;
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
        case LayerName_GROUPPROP:
        case LayerName_EXTERN:
        case LayerName_EXPORTPIC:
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
            //取@~>后的文件名
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
        case LayerName_FORMAT:
            index++;
            nameInfo.position = index;
            break;
        default:
            return null;
    }
    return nameInfo;
}


function XML_head() {
    return "<?xml version=\"1.0\" encoding=\"UTF-8\"?>";
}
function XML_setProperties(document, layer, xml, nameInfo, order) {
    xml.@Name = nameInfo.filename;
    xml.@IsCut = nameInfo.isCut;
    xml.@Quality = nameInfo.quality;
    xml.@Order = order;
    xml.@IsExtern = nameInfo.isExtern;

    var trans = Layer_getTransform(layer);

    xml.appendChild(new XML(trans.location.toXMLString("Meta_Location")));
    xml.appendChild(new XML(trans.size.toXMLString("Meta_Size")));
    
    //裁剪后使用图层的位置与大小，不裁剪使用0点位置和文档同大小
    if(nameInfo.isCut) {
        xml.appendChild(new XML(trans.location.toXMLString("Location")));
        xml.appendChild(new XML(nameInfo.cutSize.toXMLString("Size")));
    } else {
        xml.appendChild(new XML( (new Point(0,0) ).toXMLString("Location")));
        xml.appendChild(new XML(Document_getSize(document).toXMLString("Size")));
    }

    if(nameInfo.type != null) {
        xml.appendChild(new XML("<Type>"+nameInfo.type+"</Type>"));
    }
    if(nameInfo.tag != null) {
        xml.appendChild(new XML("<Tag>"+nameInfo.tag+"</Tag>"));
    }

    if(layer.kind == LayerKind.TEXT) {
        var textItem = layer.textItem;
        var kind = new XML("<LayerKind></LayerKind>");
        kind.@Type = "Text";
        kind.@Content = textItem.contents;
        // kind.@color = 
        kind.@Font = layer.textItem.font;
        kind.@Bold = layer.textItem.fauxBold;
        kind.@Italic = layer.textItem.fauxItalic;
        xml.appendChild(kind);
    }
}
function XML_getLayer(document, layer, order) {
    var nameInfo = Layer_getNameInfo(layer);
    
    var xml;
    //普通图层 或者 导出的图层组
    if(layer.typename == "ArtLayer" || (layer.typename == "LayerSet" && nameInfo.isExportPic)) {
        if(!nameInfo.isExport) {
            return null;
        }

        xml = new XML("<ArtLayer></ArtLayer>");
        nameInfo.filename = Path_prepareExt(nameInfo.filename);
        XML_setProperties(document, layer, xml, nameInfo, order);
    
    }
    else if (layer.typename == "LayerSet") 
    {
        xml = new XML("<LayerSet></LayerSet>");
        xml.@Name = nameInfo.filename;
        xml.@HasProperties = nameInfo.isExport;

        if(nameInfo.isExport) 
        {
            var prop = new XML("<LayerSetProperties></LayerSetProperties>");
            XML_setProperties(document, layer, prop, nameInfo, order);
            xml.appendChild(prop);
        }
        for(var i = 0; i < layer.layers.length; i++) 
        {
            var _xml = XML_getLayer(document, layer.layers[i], i);
            if(_xml != null) {
                xml.appendChild(_xml);
            } else {
                continue;
            }
        }
    }

    return xml;
}


function XML_getDocument(document) {
    var size = Document_getSize(document);
    var width = size.width;
    var height = size.height;
    var xml = new XML("<Document Name=\"" + Path_getFileNameWithoutExt(document.name) + "\" Width=\"" + width + "\" Height=\"" + height + "\"></Document>");

    var layers = document.layers;
    
    for(var i = 0; i < layers.length; i++) {
        var _xml = XML_getLayer(document, layers[i], i);
        if(_xml != null) {
            xml.appendChild(_xml);
        }
    }
    return xml;
}
function XML_exportDocument(document, filename) {
    var path = Path_getDirectoryName(filename);
    Path_prepare(path);
    var file = File(filename);
    file.encoding = "UTF-8";
    var xmlStr = XML_head() + "\n" + XML_getDocument(document).toXMLString();
    file.open('w');
    file.write(xmlStr);
    file.close();
}

//class Layer
function Layer_getTransform(layer) {
    return Transform_parseBounds(layer.bounds);
}

function Layer_hide(layer)
{
    layer.visible = false;
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
    if(layer == null) {
        return null;
    }
    var layerInfo = new LayerNameInfo();
    var index = 0;
    var prop = null;
    while((prop = LayerName_getProperty(layer.name, index)) != null) {
        switch(prop.propertyType) {
            case LayerName_EXTERN:
                layerInfo.isExport = true;
                layerInfo.isExtern = true;
                layerInfo.filename = prop.propertyInfo;
                break;
            case LayerName_EXPORTPIC:
                layerInfo.isExport = true;
                layerInfo.isExportPic = true;
                layerInfo.filename = prop.propertyInfo;
                break;
            case LayerName_GROUPPROP:
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
            case LayerName_FORMAT:
                layerInfo.isFormat = true;
                break;
        }
        index = prop.position;
    }
    if(layerInfo.filename == null) {
        layerInfo.filename = layer.name;
    }
    layerInfo.layerType = layer.typename;

    return layerInfo;
}

function Layer_getLayerPath(layer) {
    var arr = new Array();
    arr.push(layer.name);
    var p = layer;
    while((p = p.parent) != null) {
        if(p.typename != "ArtLayer" && p.typename != "LayerSet") {
            break;
        }
        arr.push(p.name);
    }
    return arr;
}
function Layer_findLayer(document, layerPath) {
    var c = document;
    for(var i = layerPath.length - 1; i >= 0; i--) {
        c = c.layers.getByName(layerPath[i]);
    }
    return c;
}
function Layer_hideAllWithoutLayer(rootLayers, targetLayer) {
    var layers = rootLayers.layers;
    for(var i = 0; i < layers.length; i++) {
        var layer = layers[i];
        if(layer == targetLayer) {
            continue;
        }
        if(layer.typename == "LayerSet"){
            Layer_hideAllWithoutLayer(layer, targetLayer);
        } else {
            Layer_hide(layer);
        }
    }
}
function Layer_setActiveLayerName(name) {
    app.activeDocument.activeLayer.name = name;
}
function Layer_genLayerName(isExport, isExtern, isCut, name, cutSizeWidth, cutSizeHeight, quality, tag, type){
    if(!isExport){
        return name;
    }
    var str = isExtern ? LayerName_EXTERN : LayerName_EXPORTPIC;
    str += name + LayerName_END;
    if(isCut) {
        str += LayerName_CUT;
        if(cutSizeWidth != null && cutSizeHeight != null) {
            str += cutSizeWidth + "x" + cutSizeHeight;
        }else if(cutSizeWidth != null && cutSizeHeight == null){
            str += cutSizeWidth + "x" + cutSizeWidth;
        }else if(cutSizeWidth == null && cutSizeHeight != null){
            str += cutSizeHeight + "x" + cutSizeHeight;
        }
    }
    if(quality != null && quality != DEFAULT_QUALITY) {
        str += LayerName_QUALITY + quality;
    }
    if(tag != null) {
        str += LayerName_TAG + tag.replace(";", "\\;") + ";";
    }
    if(type != null) {
        str += LayerName_TYPE + type.replace(";", "\\;") + ";";
    }
    return str;
}

/*class Document*/
function Document_save(document, filename, quality) {
    var file = new File(filename);
    var exportOption = new ExportOptionsSaveForWeb();
    exportOption.PNG8 = false;
    exportOption.quality = (quality + 1) * 10;
    exportOption.format = LayerName_getTypeByExt(Path_getFileNameExt(filename));
    document.exportDocument(file, ExportType.SAVEFORWEB, exportOption);
}

function Document_exportLayer(document, layer, path) {
    if(!layer.visible) {
        return;
    }
    var nameInfo = Layer_getNameInfo(layer);

    //如果是图层组并且不是导出层的情况下则导出子图层
    if(layer.typename == "LayerSet" && !nameInfo.isExportPic) {
        for(var i = 0; i <layer.layers.length; i++) {
            Document_exportLayer(document, layer.layers[i], path);
        }
        return;
    }
    if(!nameInfo.isExportPic) {
        return;
    }
    if(nameInfo.isExtern) {
        return;
    }

    var newDocument = document.duplicate();
    //求Layer路径后在复制的doc上获取Layer
    var newLayer = Layer_findLayer(newDocument, Layer_getLayerPath(layer));
    Layer_hideAllWithoutLayer(newDocument, newLayer);
    var trans = Layer_getTransform(newLayer);

    try{
        if(nameInfo.isCut) {
            var arr = resizeBoundsBySize(trans.bounds, nameInfo.cutSize);
            newDocument.crop(arr, 0);
        }
        Path_prepare(path);
        var filename = Path_prepareExt(nameInfo.filename, DEFAULT_EXPORT_EXT);
        Document_save(newDocument, path + "/" + filename, nameInfo.quality);
    } catch(e) {
        newDocument.close(SaveOptions.DONOTSAVECHANGES);
        throw e;
    }
    newDocument.close(SaveOptions.DONOTSAVECHANGES);
}

function Document_getSize(document) {
    return new Size(document.width.as("px"), document.height.as("px"));
}
function Document_exportAllLayer(document, path) {
    var layers = document.layers;
    for(var i = 0; i < layers.length; i++) {
        Document_exportLayer(document, layers[i], path);
    }
}

function remoteTest(i) {
    return alert("RemoteTest: " + i);
}

function getActiveDocument() {
    var document = null;
    try{
        document = app.activeDocument;
    } catch(e) {
        return null;
    }
    return document;
}
function getActiveLayer() {
    var document = getActiveDocument();
    return document != null ? document.activeLayer : null;
}
function Interface_getActiveLayerNameInfo() {
    var layer = getActiveLayer();
    if(layer == null) {
        return null;
    } else {
        return JSON.stringify(Layer_getNameInfo(layer));
    }
}
function Interface_genNameAndSetLayerName(obj){

    var layer = getActiveLayer();
    if(layer == null) {
        alert("layer null")
        return;
    }
    var trans = Layer_getTransform(layer);
    //图层大小与裁剪大小相同则不用标记具体尺寸
    if(trans.size.width == obj.cutSize.width && trans.size.height == obj.cutSize.height) {
        obj.cutSize.width = null;
        obj.cutSize.height = null;
    }
    var name = Layer_genLayerName(obj.isExport, obj.isExtern, obj.isCut, obj.filename, obj.cutSize.width, obj.cutSize.height, obj.quality, obj.tag, obj.type)

    layer.name = name;
}
function Interface_exportSelectLayer() {
    var document = getActiveDocument();
    if(document == null) {
        return null;
    }
    var exportFolder = Path_writablePath(document);
    // var exportFolder = (document.fullName + "_Assets").replace(".", "_");
    Document_exportLayer(document, document.activeLayer, exportFolder);
    alert("complete!");
}
function Interface_exportAllLayer() {
    var document = getActiveDocument();
    if(document == null) {
        return null;
    }
    var exportFolder = Path_writablePath(document);
    try{
        Document_exportAllLayer(document, exportFolder);
        alert("exportAllLayer complete!");
    } catch(e) {
        alert(e)
    }
} 
function Interface_exportDocumentMetaData() {
    var document = getActiveDocument();
    if(document == null) {
        return null;
    }
    var exportFolder = Path_writablePath(document);
    try {
        XML_exportDocument(document, exportFolder + "/" + "document.xml");
        alert("exportDocumentMetaData complete!");
    } catch (e) {
        alert(e)
    }
}
function Interface_exportAll() {
    try{
        Interface_exportAllLayer();
        Interface_exportDocumentMetaData();
    } catch(e) {
        alert(e)
    }

}
function main() {
    var r = Interface_getActiveLayerNameInfo();
}
// main();
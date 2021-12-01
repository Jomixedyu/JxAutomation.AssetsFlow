using UnityEngine;
using UnityEngine.UI;
using UnityEditor;
using JxCode.Automation.AssetsFlow.PSExporter;
using System.IO;
using System;

public class UIGenerator : EditorWindow
{
    [MenuItem("Automation/AssetsFlow/UGUIGenerator")]
    public static void Open()
    {
        UIGenerator win = EditorWindow.GetWindow(typeof(UIGenerator), false, "UGUIGenerator", true) as UIGenerator;
        win.Show();
    }

    private string assetsFolder = string.Empty;
    private string externFolder = string.Empty;

    public void OnGUI()
    {
        GUILayout.Space(20);
        GUI.skin.label.fontSize = 20;
        GUI.skin.label.alignment = TextAnchor.MiddleCenter;
        GUILayout.Label("JxAssetsFlow.UGUI");
        GUILayout.Space(10);

        GUI.skin.label.fontSize = 12;
        GUI.skin.label.alignment = TextAnchor.UpperLeft;
        this.assetsFolder = EditorGUILayout.TextField("Assets Folder", this.assetsFolder);
        this.externFolder = EditorGUILayout.TextField("Extern Folder", this.externFolder);

        GUILayout.Space(10);
        if (GUILayout.Button("Generate"))
        {
            this.Generate_Click();
        }
    }
    private Vector2 LeftTopAnchorsToCenter(Vector2 fsize, Vector2 ssize, Vector2 pos)
    {
        return new Vector2(fsize.x / -2 + ssize.x / 2 + pos.x, fsize.y / 2 - ssize.y / 2 - pos.y);
    }
    /// <summary>
    /// 反转Transform里的所有Child
    /// </summary>
    /// <param name="transform"></param>
    private void Reserve(Transform transform)
    {
        for (int i = 0; i < transform.childCount; i++)
        {
            transform.GetChild(0).SetSiblingIndex(transform.childCount - 1 - i);
        }
        for (int i = 0; i < transform.childCount; i++)
        {
            Reserve(transform.GetChild(i));
        }
    }
    private void Generate_Click()
    {
        string docFile = AssetDatabase.LoadAssetAtPath<TextAsset>("Assets/" + this.assetsFolder + "/document.xml")?.text;
        if (docFile == null)
        {
            EditorUtility.DisplayDialog("alert", "素材文件夹不存在", "ok");
            return;
        }
        Document doc = Document.ReadDocument(docFile);
        GameObject root = new GameObject(doc.Name);
        var rootRect = root.AddComponent<RectTransform>();
        rootRect.sizeDelta = new Vector2(doc.Width, doc.Height);

        foreach (Layer item in doc.Layers)
        {
            this.GenerateNode(doc, item, root.transform);
        }
        Reserve(rootRect);
        EditorUtility.DisplayDialog("alert", "Generate done", "ok");
    }
    private T LoadAsset<T>(string path) where T : UnityEngine.Object
    {
        return AssetDatabase.LoadAssetAtPath<T>("Assets/" + this.assetsFolder + "/" + path);
    }
    private void GenerateNode(Document doc, Layer layer, Transform transform)
    {
        if (layer.LayerType == LayerType.ArtLayer)
        {
            ArtLayer art = layer as ArtLayer;
            //去掉后缀
            GameObject go = new GameObject(Path.GetFileNameWithoutExtension(layer.Name));
            var goRect = go.AddComponent<RectTransform>();
            go.transform.SetParent(transform);

            goRect.sizeDelta = new Vector2(art.Size.Width, art.Size.Height);

            goRect.localPosition = LeftTopAnchorsToCenter(transform.GetComponent<RectTransform>().sizeDelta, goRect.sizeDelta, new Vector2(art.Location.x, art.Location.y));

            if (!art.IsExtern)
            {
                //图层类型
                //图形
                //if(art.Type == null || art.Type == ExportType.Image)
                {
                    var img = go.AddComponent<Image>();
                    img.raycastTarget = false;
                    img.sprite = LoadAsset<Sprite>(art.Name);
                }
            }
        }
        else if (layer.LayerType == LayerType.LayerSet)
        {
            LayerSet set = layer as LayerSet;
            var setObj = new GameObject(layer.Name);

            var setObjRect = setObj.AddComponent<RectTransform>();
            setObj.transform.SetParent(transform);

            if (layer.Type == ExportType.Button)
            {
                //按钮组，拦截子对象
                setObjRect.sizeDelta = new Vector2(set.Meta_Size.Width, set.Meta_Size.Height);
                setObjRect.localPosition = LeftTopAnchorsToCenter(transform.GetComponent<RectTransform>().sizeDelta, setObjRect.sizeDelta, new Vector2(set.Meta_Location.x, set.Meta_Location.y));

                var btn = setObj.AddComponent<Button>();

                btn.transition = Selectable.Transition.SpriteSwap;
                btn.image = setObj.AddComponent<Image>();
                btn.image.sprite = LoadAsset<Sprite>(set.Layers[0].Name);
                btn.spriteState = new SpriteState()
                {
                    highlightedSprite = LoadAsset<Sprite>(set.Layers[1].Name),
                    pressedSprite = LoadAsset<Sprite>(set.Layers[2].Name),
                };
            }
            else
            {
                //普通组
                setObjRect.sizeDelta = new Vector2(doc.Width, doc.Height);
                setObjRect.localPosition = Vector2.zero;
                foreach (Layer item in set.Layers)
                {
                    GenerateNode(doc, item, setObj.transform);
                }
            }

        }
    }

}


namespace JxCode.Automation.AssetsFlow.PSExporter
{
    using System.Collections.Generic;
    using System.Xml;
    using System.Xml.Serialization;

    public struct Size
    {
        [XmlAttribute]
        public int Width;
        [XmlAttribute]
        public int Height;

        public Size(int width, int height)
        {
            Width = width;
            Height = height;
        }

        public override string ToString()
        {
            return string.Format("[width: {0}, height: {1}]", this.Width, this.Height);
        }
    }
    public struct Point
    {
        [XmlAttribute]
        public int x;
        [XmlAttribute]
        public int y;

        public Point(int x, int y)
        {
            this.x = x;
            this.y = y;
        }
        public override string ToString()
        {
            return string.Format("[x: {0}, y: {1}]", this.x, this.y);
        }
    }

    public enum LayerType
    {
        ArtLayer,
        LayerSet,
    }
    public abstract class Layer
    {
        [XmlAttribute]
        public string Name { get; set; }
        [XmlAttribute]
        public int Order { get; set; }
        public abstract LayerType LayerType { get; }

        [XmlAttribute]
        public bool IsCut { get; set; }
        [XmlAttribute]
        public int Quality { get; set; }
        [XmlAttribute]
        public bool IsExtern { get; set; }

        public Size Meta_Size { get; set; }
        public Point Meta_Location { get; set; }

        public Point Location { get; set; }
        public Size Size { get; set; }

        public string Tag { get; set; }
        public string Type { get; set; }

        public override string ToString()
        {
            return "Name: " + this.Name + ", Type: " + this.LayerType.ToString();
        }
    }
    public class ArtLayer : Layer
    {
        public override LayerType LayerType { get => LayerType.ArtLayer; }

    }
    public class LayerSet : Layer
    {
        [XmlAttribute]
        public List<Layer> Layers { get; set; } = new List<Layer>();
        [XmlAttribute]
        public bool HasProperties { get; set; }
        public override LayerType LayerType => LayerType.LayerSet;

    }
    public static class ExportType
    {
        public static readonly string Image = "Image";
        public static readonly string Text = "Text";
        public static readonly string Button = "Button";
        public static readonly string Slider = "Slider";
        public static readonly string HScrollBar = "HScrollBar";
        public static readonly string VScrollBar = "VScrollBar";
        public static readonly string Toggle = "Toggle";
        public static readonly string InputBox = "InputBox";
        public static readonly string CheckBox = "CheckBox";
        public static readonly string RadioBox = "RadioBox";
        public static readonly string ComboBox = "ComboBox";
    }
    public class Document
    {
        [XmlAttribute]
        public string Name { get; set; }
        [XmlAttribute]
        public int Width { get; set; }
        [XmlAttribute]
        public int Height { get; set; }
        [XmlAttribute]
        public List<Layer> Layers { get; set; } = new List<Layer>();

        private static Point ReadPoint(XmlElement xml)
        {
            if (xml == null) return default;
            return new Point(
                int.Parse(xml.GetAttribute("x")),
                int.Parse(xml.GetAttribute("y"))
            );
        }
        private static Size ReadSize(XmlElement xml)
        {
            if (xml == null) return default;
            return new Size(
                int.Parse(xml.GetAttribute("width")),
                int.Parse(xml.GetAttribute("height"))
            );
        }

        private static void ReadElement(XmlElement xml, List<Layer> list)
        {
            Layer layer = null;
            ArtLayer art = null;
            LayerSet set = null;
            bool isRead = false;

            XmlElement _xml = xml;
            if (xml.Name == nameof(ArtLayer))
            {
                layer = art = new ArtLayer();
                isRead = true;
            }
            else if (xml.Name == nameof(LayerSet))
            {
                layer = set = new LayerSet();

                set.HasProperties = bool.Parse(xml.GetAttribute("HasProperties"));

                if (set.HasProperties)
                {
                    _xml = xml["LayerSetProperties"];
                    isRead = true;
                }

                foreach (XmlElement item in xml)
                {
                    //跳过组属性
                    if (set.HasProperties && item.Name == "LayerSetProperties")
                        continue;
                    ReadElement(item, set.Layers);
                }
            }

            list.Add(layer);

            layer.Name = _xml.GetAttribute("Name");
            if (isRead)
            {
                layer.IsCut = bool.Parse(_xml.GetAttribute("IsCut"));
                layer.Quality = int.Parse(_xml.GetAttribute("Quality"));
                layer.Order = int.Parse(_xml.GetAttribute("Order"));
                layer.IsExtern = bool.Parse(_xml.GetAttribute("IsExtern"));

                layer.Meta_Location = ReadPoint(_xml["Meta_Location"]);
                layer.Location = ReadPoint(_xml["Location"]);
                layer.Meta_Size = ReadSize(_xml["Meta_Size"]);
                layer.Size = ReadSize(_xml["Size"]);
                layer.Tag = _xml["Tag"]?.InnerText;
                layer.Type = _xml["Type"]?.InnerText;
            }

        }
        public static Document ReadDocument(string xmlStr)
        {
            XmlDocument xml = new XmlDocument();
            xml.LoadXml(xmlStr);
            Document doc = new Document();
            var xmlEle = xml.DocumentElement;
            doc.Name = xmlEle.GetAttribute("Name");
            doc.Width = int.Parse(xmlEle.GetAttribute("Width"));
            doc.Height = int.Parse(xmlEle.GetAttribute("Height"));
            foreach (XmlElement item in xml.DocumentElement)
            {
                ReadElement(item, doc.Layers);
            }
            return doc;
        }
    }
}


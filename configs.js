export const filterConfigs = [
    {
        id: "original",
        name: "Original",
        lut: null,
        enableLUT: false,
        chromaKeys: [],
        colorCorrections: []
    },
    {
        id: "blue",
        name: "Blue",
        lut: "LUTs/blue-isolated.png",
        enableLUT: true,
        chromaKeys: [],
        colorCorrections: []
    },
    {
        id: "red",
        name: "Red",
        lut: "LUTs/red-isolated.png",
        enableLUT: true,
        chromaKeys: [],
        colorCorrections: []
    },
    {
        id: "green",
        name: "Green",
        lut: "LUTs/green-isolated.png",
        enableLUT: true,
        chromaKeys: [],
        colorCorrections: []
    },
    {
        id: "blue-enhanced",
        name: "Blue (Enhanced)",
        lut: "LUTs/blue-isolated.png",
        enableLUT: true,
        chromaKeys: [
            {
                ckey_color: [80 / 255, 101 / 255, 102 / 255],
                ckey_similarity: 10.0 / 255.0,
                ckey_smoothness: 31.0,
                ckey_spill: 195.0
            }
        ],
        colorCorrections: [
            {
                gamma: -0.06,
                contrast: 0.23,
                saturation: 1.39
            }
        ]
    }
];
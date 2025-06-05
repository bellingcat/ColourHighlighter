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
        name: "Blue+",
        lut: "LUTs/blue-isolated.png",
        enableLUT: true,
        chromaKeys: [
            {
                ckey_color: [41 / 255, 49 / 255, 36 / 255],
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
    },
    {
        id: "red-enhanced",
        name: "Red+",
        lut: "LUTs/red-isolated.png",
        enableLUT: true,
        chromaKeys: [
            {
                ckey_color: [91 / 255, 0 / 115, 187 / 255],
                ckey_similarity: 1.0 / 255.0,
                ckey_smoothness: 1.0,
                ckey_spill: 347.0
            }
        ],
        colorCorrections: [
            {
                gamma: 0.03,
                contrast: 0.13,
                brightness: 0.0493,
                saturation: 3.3
            },

        ]
    },
    {
        id: "green-enhanced",
        name: "Green+",
        lut: "LUTs/green-isolated.png",
        enableLUT: true,
        chromaKeys: [
            {
                ckey_color: [38 / 255, 47 / 255, 40 / 255],
                ckey_similarity: 1.0 / 255.0,
                ckey_smoothness: 1.0,
                ckey_spill: 30.0
            }
        ],
        colorCorrections: [
            {
                gamma: -0.15,
                contrast: 0.25,
                saturation: 0.34
            }
        ]
    }
];
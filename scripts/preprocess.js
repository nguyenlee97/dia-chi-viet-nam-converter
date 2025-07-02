// Mock preprocessing script for demo purposes
// In real implementation, this would process the actual Vietnamese administrative data
// and generate selection_tree.json and detailed_ward_data.json

const fs = require('fs');
const path = require('path');

// Mock data structure for demonstration
const mockSelectionTree = {
    "Hà Nội": {
        "Quận Ba Đình": [
            "Phường Điện Biên", 
            "Phường Đội Cấn", 
            "Phường Liễu Giai",
            "Phường Ngọc Hà",
            "Phường Phúc Xá"
        ],
        "Quận Hoàn Kiếm": [
            "Phường Chương Dương", 
            "Phường Cửa Nam", 
            "Phường Đồng Xuân",
            "Phường Hàng Bài",
            "Phường Hàng Bồ"
        ],
        "Quận Hai Bà Trưng": [
            "Phường Bách Khoa", 
            "Phường Bạch Đằng", 
            "Phường Cầu Dền",
            "Phường Đống Mác",
            "Phường Lê Đại Hành"
        ]
    },
    "TP. Hồ Chí Minh": {
        "Quận 1": [
            "Phường Bến Nghé", 
            "Phường Bến Thành", 
            "Phường Cầu Kho",
            "Phường Cầu Ông Lãnh",
            "Phường Cô Giang"
        ],
        "Quận 3": [
            "Phường 01", 
            "Phường 02", 
            "Phường 03",
            "Phường 04",
            "Phường 05"
        ],
        "Quận Bình Thạnh": [
            "Phường 01", 
            "Phường 02", 
            "Phường 03",
            "Phường 11",
            "Phường 12"
        ]
    },
    "Đà Nẵng": {
        "Quận Hải Châu": [
            "Phường Hải Châu I", 
            "Phường Hải Châu II", 
            "Phường Thanh Bình",
            "Phường Thuận Phước",
            "Phường Thạch Thang"
        ],
        "Quận Thanh Khê": [
            "Phường Thanh Khê Đông", 
            "Phường Thanh Khê Tây", 
            "Phường Tam Thuận",
            "Phường An Khê",
            "Phường Tân Chính"
        ]
    }
};

const mockDetailedWardData = new Map([
    ["Hà Nội|Quận Ba Đình|Phường Điện Biên", {
        is_splitted: false,
        new_address: "Phường Điện Biên, Quận Ba Đình, TP. Hà Nội"
    }],
    ["TP. Hồ Chí Minh|Quận 1|Phường Bến Nghé", {
        is_splitted: true,
        new_address: {
            new_province_name: "TP. Hồ Chí Minh",
            new_ward_name: [
                {
                    new_ward_name: "Phường Bến Nghé Đông",
                    centroid: [106.7009, 10.7769],
                    new_ward_coordinate: [[[
                        [106.700, 10.775], [106.702, 10.775], 
                        [106.702, 10.778], [106.700, 10.778], 
                        [106.700, 10.775]
                    ]]]
                },
                {
                    new_ward_name: "Phường Bến Nghé Tây",
                    centroid: [106.6989, 10.7759],
                    new_ward_coordinate: [[[
                        [106.697, 10.774], [106.699, 10.774], 
                        [106.699, 10.777], [106.697, 10.777], 
                        [106.697, 10.774]
                    ]]]
                }
            ]
        }
    }],
    ["Đà Nẵng|Quận Hải Châu|Phường Hải Châu I", {
        is_splitted: false,
        new_address: "Phường Hải Châu I, Quận Hải Châu, TP. Đà Nẵng"
    }]
]);

// Ensure directories exist
const apiDataDir = path.join(__dirname, '..', 'api', '_data');
if (!fs.existsSync(apiDataDir)) {
    fs.mkdirSync(apiDataDir, { recursive: true });
}

// Write the mock data files
try {
    fs.writeFileSync(
        path.join(apiDataDir, 'selection_tree.json'),
        JSON.stringify(mockSelectionTree, null, 2)
    );
    
    fs.writeFileSync(
        path.join(apiDataDir, 'detailed_ward_data.json'),
        JSON.stringify([...mockDetailedWardData], null, 2)
    );
    
    console.log('✅ Mock data files generated successfully!');
    console.log(`📁 Files created in: ${apiDataDir}`);
    console.log('📝 selection_tree.json - Contains province/district/ward hierarchy');
    console.log('📝 detailed_ward_data.json - Contains ward transformation data');
} catch (error) {
    console.error('❌ Error generating mock data:', error);
    process.exit(1);
}
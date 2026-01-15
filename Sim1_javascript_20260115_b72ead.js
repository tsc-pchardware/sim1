// ===== COMPONENT DEFINITIONS =====
const COMPONENTS = {
    cpu: {
        id: 'cpu',
        name: 'CPU Socket',
        icon: 'fas fa-microchip',
        description: 'Processor socket (LGA1700/AM5)',
        width: 4,   // squares (2 inches)
        height: 4,  // squares (2 inches)
        color: 'cpu',
        category: 'core',
        requirements: {
            minClearance: 3, // squares clearance on all sides
            mustBeInCenter: true,
            cannotTouchEdge: true
        },
        info: 'Central Processing Unit socket. Must have adequate clearance for cooling.'
    },
    ram: {
        id: 'ram',
        name: 'RAM Slot',
        icon: 'fas fa-memory',
        description: 'DDR4/DDR5 memory slot',
        width: 1,
        height: 11, // 5.5 inches
        color: 'ram',
        category: 'core',
        requirements: {
            mustBeRightOfCPU: true,
            spacingBetween: 1, // squares between slots
            channelArrangement: ['A2', 'B2', 'A1', 'B1']
        },
        info: 'Dual In-line Memory Module slots. Install in correct channel pairs for dual-channel.'
    },
    pcie16: {
        id: 'pcie16',
        name: 'PCIe x16',
        icon: 'fas fa-expand-alt',
        description: 'Graphics card slot (PCIe 5.0)',
        width: 2,
        height: 14, // 7 inches
        color: 'pcie',
        category: 'expansion',
        requirements: {
            mustBeBelowCPU: true,
            minDistanceFromRAM: 2,
            prioritySlot: true
        },
        info: 'Primary expansion slot for graphics cards. Requires direct CPU lanes.'
    },
    pcie1: {
        id: 'pcie1',
        name: 'PCIe x1',
        icon: 'fas fa-compress-alt',
        description: 'Small expansion slot',
        width: 1,
        height: 3,
        color: 'pcie',
        category: 'expansion',
        requirements: {
            canShareSpace: true
        },
        info: 'For sound cards, network cards, etc. Shares bandwidth through chipset.'
    },
    m2: {
        id: 'm2',
        name: 'M.2 Slot',
        icon: 'fas fa-hdd',
        description: 'NVMe SSD slot (2280)',
        width: 2,
        height: 4, // 2 inches
        color: 'storage',
        category: 'storage',
        requirements: {
            avoidGPUCoverage: true,
            coolingRequired: true
        },
        info: 'High-speed SSD connector. Can be CPU-direct or chipset-connected.'
    },
    sata: {
        id: 'sata',
        name: 'SATA Ports',
        icon: 'fas fa-database',
        description: '6x SATA 6Gb/s',
        width: 2,
        height: 3,
        color: 'storage',
        category: 'storage',
        requirements: {
            avoidRightOfPCIe: true,
            angledRecommended: true
        },
        info: 'For 2.5"/3.5" hard drives and SSDs. Angled ports prevent GPU blockage.'
    },
    atx24: {
        id: 'atx24',
        name: '24-pin ATX',
        icon: 'fas fa-plug',
        description: 'Main motherboard power',
        width: 3,
        height: 2,
        color: 'power',
        category: 'power',
        requirements: {
            edgePlacement: 'right',
            cableRoutingSpace: true
        },
        info: '24-pin main power connector. Place near edge for cable management.'
    },
    eps8: {
        id: 'eps8',
        name: '8-pin EPS',
        icon: 'fas fa-bolt',
        description: 'CPU power connector',
        width: 2,
        height: 2,
        color: 'power',
        category: 'power',
        requirements: {
            edgePlacement: 'top',
            nearCPU: true
        },
        info: '8-pin CPU power. Place near top edge, close to CPU socket.'
    },
    chipset: {
        id: 'chipset',
        name: 'Chipset',
        icon: 'fas fa-brain',
        description: 'Platform Controller Hub',
        width: 3,
        height: 3,
        color: 'chipset',
        category: 'core',
        requirements: {
            needsHeatsink: true,
            centralLocation: true
        },
        info: 'Manages I/O, SATA, USB, and secondary PCIe lanes.'
    },
    usb32: {
        id: 'usb32',
        name: 'USB 3.2 Header',
        icon: 'fas fa-usb',
        description: 'Internal USB header',
        width: 2,
        height: 1,
        color: 'storage',
        category: 'io',
        info: 'Internal connector for front-panel USB ports.'
    },
    frontPanel: {
        id: 'frontPanel',
        name: 'Front Panel',
        icon: 'fas fa-sliders-h',
        description: 'Power switch/LEDs',
        width: 2,
        height: 1,
        color: 'power',
        category: 'io',
        info: 'Connector for case power button, reset, LEDs.'
    },
    audio: {
        id: 'audio',
        name: 'Audio Codec',
        icon: 'fas fa-volume-up',
        description: 'HD Audio header',
        width: 2,
        height: 2,
        color: 'storage',
        category: 'io',
        info: 'Audio connectors, often isolated to reduce interference.'
    }
};

// ===== FORM FACTOR DEFINITIONS =====
const FORM_FACTORS = {
    atx: {
        name: 'ATX',
        width: 24,  // squares (12 inches)
        height: 19, // squares (9.5 inches)
        maxComponents: 12,
        description: 'Standard desktop size'
    },
    matx: {
        name: 'Micro-ATX',
        width: 19,  // squares (9.5 inches)
        height: 19, // squares (9.5 inches)
        maxComponents: 10,
        description: 'Compact but expandable'
    },
    itx: {
        name: 'Mini-ITX',
        width: 13,  // squares (6.5 inches)
        height: 13, // squares (6.5 inches)
        maxComponents: 8,
        description: 'Ultra-compact form factor'
    },
    eatx: {
        name: 'E-ATX',
        width: 24,  // squares (12 inches)
        height: 26, // squares (13 inches)
        maxComponents: 15,
        description: 'Extended for workstations'
    }
};

// ===== CHALLENGES =====
const CHALLENGES = {
    beginner: {
        title: 'Beginner: Basic ATX Layout',
        description: 'Design a basic ATX motherboard with essential components.',
        objectives: [
            { id: 'cpu', required: true, count: 1 },
            { id: 'ram', required: true, count: 4 },
            { id: 'pcie16', required: true, count: 1 },
            { id: 'atx24', required: true, count: 1 },
            { id: 'eps8', required: true, count: 1 }
        ],
        formFactor: 'atx',
        socketType: 'lga1700',
        tips: [
            'Place CPU near center-top',
            'RAM slots go right of CPU',
            'PCIe x16 below CPU with clearance',
            'Power connectors on edges'
        ]
    },
    intermediate: {
        title: 'Intermediate: Gaming mATX',
        description: 'Design a Micro-ATX gaming motherboard with multiple expansion options.',
        objectives: [
            { id: 'cpu', required: true, count: 1 },
            { id: 'ram', required: true, count: 4 },
            { id: 'pcie16', required: true, count: 1 },
            { id: 'pcie1', required: true, count: 2 },
            { id: 'm2', required: true, count: 2 },
            { id: 'sata', required: true, count: 4 },
            { id: 'chipset', required: true, count: 1 }
        ],
        formFactor: 'matx',
        socketType: 'am5',
        tips: [
            'Limited space - plan carefully',
            'M.2 slots should avoid GPU coverage',
            'Chipset needs heatsink space',
            'Consider cable routing'
        ]
    },
    advanced: {
        title: 'Advanced: Content Creator',
        description: 'Design an ATX motherboard for content creation with maximum connectivity.',
        objectives: [
            { id: 'cpu', required: true, count: 1 },
            { id: 'ram', required: true, count: 4 },
            { id: 'pcie16', required: true, count: 2 },
            { id: 'm2', required: true, count: 3 },
            { id: 'sata', required: true, count: 8 },
            { id: 'usb32', required: true, count: 2 },
            { id: 'audio', required: true, count: 1 }
        ],
        formFactor: 'atx',
        socketType: 'am5',
        tips: [
            'Dual PCIe x16 for GPU + capture card',
            'Multiple M.2 for fast storage',
            'Plenty of SATA for hard drives',
            'High-quality audio isolation'
        ]
    },
    expert: {
        title: 'Expert: Mini-ITX Max',
        description: 'Maximum functionality in minimal space - the ultimate challenge.',
        objectives: [
            { id: 'cpu', required: true, count: 1 },
            { id: 'ram', required: true, count: 2 },
            { id: 'pcie16', required: true, count: 1 },
            { id: 'm2', required: true, count: 2 },
            { id: 'sata', required: true, count: 4 },
            { id: 'chipset', required: true, count: 1 }
        ],
        formFactor: 'itx',
        socketType: 'lga1700',
        tips: [
            'Every square inch matters',
            'Stack components vertically if possible',
            'Consider specialized cooling',
            'Trade-offs required'
        ]
    },
    troubleshoot: {
        title: 'Troubleshoot: Fix the Design',
        description: 'This motherboard has critical design flaws. Identify and fix them.',
        objectives: [
            { id: 'cpu', required: true, count: 1 },
            { id: 'ram', required: true, count: 4 },
            { id: 'pcie16', required: true, count: 1 },
            { id: 'm2', required: true, count: 1 },
            { id: 'sata', required: true, count: 6 }
        ],
        formFactor: 'atx',
        socketType: 'am5',
        preplacedErrors: true,
        tips: [
            'Look for clearance issues',
            'Check component accessibility',
            'Verify power delivery',
            'Identify thermal problems'
        ]
    }
};
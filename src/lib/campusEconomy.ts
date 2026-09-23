export const getDailyCoins = (minutes: number) => {
  let coins = minutes * 2;
  if (minutes >= 1080) { // 18 hours
    coins += 3520;
  } else if (minutes >= 600) { // 10 hours
    coins += 1320;
  }
  return Math.floor(coins);
};

export const getDailyXP = (minutes: number) => {
  let xp = 0;
  // 0-4h (0-240 min)
  const tier1 = Math.min(minutes, 240);
  xp += tier1 * 1;
  
  // 4-8h (240-480 min)
  if (minutes > 240) {
    const tier2 = Math.min(minutes - 240, 240);
    xp += tier2 * 0.5;
  }
  
  // 8h+ (480+ min)
  if (minutes > 480) {
    const tier3 = minutes - 480;
    xp += tier3 * 0.25;
  }
  
  if (minutes >= 1080) {
    xp += 220;
  } else if (minutes >= 600) {
    xp += 88;
  }
  
  return xp;
};

export const getLevelFromXP = (xp: number) => {
  const level = Math.floor(Math.sqrt(xp / 26.3));
  return level < 1 ? 1 : level;
};

export const getXPForLevel = (level: number) => {
  return 26.3 * Math.pow(level, 2);
};

export const getCollegePrice = (rank: number) => {
  return Math.round(210 * Math.pow(rank, 1.15));
};

export const getCumulativeCoinsNeeded = (rank: number) => {
  let sum = 0;
  for (let i = 1; i <= rank; i++) {
    sum += getCollegePrice(i);
  }
  return sum;
};

export const getCollegeLevelRequired = (rank: number) => {
  return Math.ceil(2.759 * Math.pow(rank, 0.9));
};

export const COLLEGES = [
  { id: 1, rank: 54, name: "NIT Arunachal Pradesh", type: "NIT" },
  { id: 2, rank: 53, name: "NIT Nagaland", type: "NIT" },
  { id: 3, rank: 52, name: "NIT Mizoram", type: "NIT" },
  { id: 4, rank: 51, name: "NIT Manipur", type: "NIT" },
  { id: 5, rank: 50, name: "NIT Meghalaya", type: "NIT" },
  { id: 6, rank: 49, name: "NIT Sikkim", type: "NIT" },
  { id: 7, rank: 48, name: "NIT Agartala", type: "NIT" },
  { id: 8, rank: 47, name: "NIT Andhra Pradesh", type: "NIT" },
  { id: 9, rank: 46, name: "NIT Puducherry", type: "NIT" },
  { id: 10, rank: 45, name: "NIT Delhi", type: "NIT" },
  { id: 11, rank: 44, name: "NIT Uttarakhand", type: "NIT" },
  { id: 12, rank: 43, name: "NIT Goa", type: "NIT" },
  { id: 13, rank: 42, name: "NIT Raipur", type: "NIT" },
  { id: 14, rank: 41, name: "NIT Patna", type: "NIT" },
  { id: 15, rank: 40, name: "NIT Jamshedpur", type: "NIT" },
  { id: 16, rank: 39, name: "NIT Srinagar (J&K)", type: "NIT" },
  { id: 17, rank: 38, name: "NIT Hamirpur", type: "NIT" },
  { id: 18, rank: 37, name: "NIT Silchar", type: "NIT" },
  { id: 19, rank: 36, name: "VNIT Nagpur", type: "NIT" },
  { id: 20, rank: 35, name: "SVNIT Surat", type: "NIT" },
  { id: 21, rank: 34, name: "NIT Jalandhar", type: "NIT" },
  { id: 22, rank: 33, name: "NIT Durgapur", type: "NIT" },
  { id: 23, rank: 32, name: "NIT Kurukshetra", type: "NIT" },
  { id: 24, rank: 31, name: "MNIT Jaipur", type: "NIT" },
  { id: 25, rank: 30, name: "MANIT Bhopal", type: "NIT" },
  { id: 26, rank: 29, name: "MNNIT Allahabad", type: "NIT" },
  { id: 27, rank: 28, name: "NIT Calicut", type: "NIT" },
  { id: 28, rank: 27, name: "NIT Rourkela", type: "NIT" },
  { id: 29, rank: 26, name: "NIT Warangal", type: "NIT" },
  { id: 30, rank: 25, name: "NIT Surathkal", type: "NIT" },
  { id: 31, rank: 24, name: "NIT Trichy", type: "NIT" },
  { id: 32, rank: 23, name: "IIT Dharwad", type: "IIT" },
  { id: 33, rank: 22, name: "IIT Jammu", type: "IIT" },
  { id: 34, rank: 21, name: "IIT Goa", type: "IIT" },
  { id: 35, rank: 20, name: "IIT Bhilai", type: "IIT" },
  { id: 36, rank: 19, name: "IIT Tirupati", type: "IIT" },
  { id: 37, rank: 18, name: "IIT Palakkad", type: "IIT" },
  { id: 38, rank: 17, name: "IIT Mandi", type: "IIT" },
  { id: 39, rank: 16, name: "IIT Jodhpur", type: "IIT" },
  { id: 40, rank: 15, name: "IIT Patna", type: "IIT" },
  { id: 41, rank: 14, name: "IIT Gandhinagar", type: "IIT" },
  { id: 42, rank: 13, name: "IIT Bhubaneswar", type: "IIT" },
  { id: 43, rank: 12, name: "IIT Ropar", type: "IIT" },
  { id: 44, rank: 11, name: "IIT (ISM) Dhanbad", type: "IIT" },
  { id: 45, rank: 10, name: "IIT (BHU) Varanasi", type: "IIT" },
  { id: 46, rank: 9, name: "IIT Indore", type: "IIT" },
  { id: 47, rank: 8, name: "IIT Hyderabad", type: "IIT" },
  { id: 48, rank: 7, name: "IIT Guwahati", type: "IIT" },
  { id: 49, rank: 6, name: "IIT Roorkee", type: "IIT" },
  { id: 50, rank: 5, name: "IIT Kharagpur", type: "IIT" },
  { id: 51, rank: 4, name: "IIT Kanpur", type: "IIT" },
  { id: 52, rank: 3, name: "IIT Delhi", type: "IIT" },
  { id: 53, rank: 2, name: "IIT Madras", type: "IIT" },
  { id: 54, rank: 1, name: "IIT Bombay", type: "IIT" },
];

export const getCampusProgress = (totalXP: number, totalCoins: number) => {
  const currentLevel = getLevelFromXP(totalXP);
  let unlockedRank = 0;
  
  for (let i = 1; i <= COLLEGES.length; i++) {
    const requiredLevel = getCollegeLevelRequired(i);
    const requiredCoins = getCumulativeCoinsNeeded(i);
    if (currentLevel >= requiredLevel && totalCoins >= requiredCoins) {
      unlockedRank = i;
    } else {
      break;
    }
  }
  
  const nextCollege = unlockedRank < COLLEGES.length ? COLLEGES[unlockedRank] : null;
  const requiredLevelForNext = nextCollege ? getCollegeLevelRequired(unlockedRank + 1) : null;
  const requiredCoinsForNext = nextCollege ? getCumulativeCoinsNeeded(unlockedRank + 1) : null;
  
  return {
    currentLevel,
    unlockedRank,
    nextCollege,
    requiredLevelForNext,
    requiredCoinsForNext
  };
};

import { Person, KinshipResult } from '../types/family';

interface PathNode {
  personId: string;
  relationFromPrev: string; // e.g. "cha", "mẹ", "con", "vợ", "chồng"
}

export function calculateKinship(
  p1Id: string,
  p2Id: string,
  members: Record<string, Person>
): KinshipResult {
  const p1 = members[p1Id];
  const p2 = members[p2Id];

  if (!p1 || !p2) {
    return {
      person1Title: 'Không xác định',
      person2Title: 'Không xác định',
      description: 'Không tìm thấy thông tin của một trong hai thành viên.',
      relationshipType: 'unknown',
      pathDescription: [],
      generationDiff: 0,
      isPaternal: true,
    };
  }

  if (p1Id === p2Id) {
    return {
      person1Title: 'Chính mình',
      person2Title: 'Chính mình',
      description: 'Hai người được chọn là cùng một thành viên trong gia tộc.',
      relationshipType: 'same',
      pathDescription: [`${p1.fullName} (Bản thân)`],
      generationDiff: 0,
      isPaternal: true,
    };
  }

  // Check direct spouse
  if (p1.spouseIds.includes(p2Id) || p2.spouseIds.includes(p1Id)) {
    const isP1Male = p1.gender === 'male';
    return {
      person1Title: isP1Male ? 'Vợ' : 'Chồng',
      person2Title: isP1Male ? 'Chồng' : 'Vợ',
      description: `${p1.fullName} và ${p2.fullName} là vợ chồng của nhau.`,
      relationshipType: 'spouse',
      pathDescription: [`${p1.fullName}`, `Vợ/Chồng với`, `${p2.fullName}`],
      generationDiff: 0,
      isPaternal: true,
    };
  }

  // Find shortest path in family graph using BFS
  const path = findShortestRelationshipPath(p1Id, p2Id, members);
  const pathDescription = formatPathDescription(path, members);

  // Check Direct Parent / Child
  if (p1.childrenIds.includes(p2Id) || p2.fatherId === p1Id || p2.motherId === p1Id) {
    const p1IsMale = p1.gender === 'male';
    const p2IsMale = p2.gender === 'male';
    const p2Title = p2IsMale ? (p2.birthOrder === 1 ? 'Con trai trưởng' : 'Con trai') : (p2.birthOrder === 1 ? 'Con gái trưởng' : 'Con gái');
    const p1Title = p1IsMale ? 'Cha (Bố)' : 'Mẹ';
    return {
      person1Title: p2Title, // P1 gọi P2 là Con
      person2Title: p1Title, // P2 gọi P1 là Cha/Mẹ
      description: `${p1.fullName} là ${p1Title.toLowerCase()} của ${p2.fullName}.`,
      relationshipType: 'direct',
      pathDescription,
      generationDiff: -1,
      isPaternal: p1IsMale,
    };
  }

  if (p2.childrenIds.includes(p1Id) || p1.fatherId === p2Id || p1.motherId === p2Id) {
    const p2IsMale = p2.gender === 'male';
    const p1IsMale = p1.gender === 'male';
    const p1Title = p1IsMale ? (p1.birthOrder === 1 ? 'Con trai trưởng' : 'Con trai') : (p1.birthOrder === 1 ? 'Con gái trưởng' : 'Con gái');
    const p2Title = p2IsMale ? 'Cha (Bố)' : 'Mẹ';
    return {
      person1Title: p2Title, // P1 gọi P2 là Cha/Mẹ
      person2Title: p1Title, // P2 gọi P1 là Con
      description: `${p2.fullName} là ${p2Title.toLowerCase()} của ${p1.fullName}.`,
      relationshipType: 'direct',
      pathDescription,
      generationDiff: 1,
      isPaternal: p2IsMale,
    };
  }

  // Check Siblings (Anh / Chị / Em ruột)
  const p1Parents = [p1.fatherId, p1.motherId].filter(Boolean) as string[];
  const p2Parents = [p2.fatherId, p2.motherId].filter(Boolean) as string[];
  const hasCommonParent = p1Parents.some(p => p2Parents.includes(p));

  if (hasCommonParent) {
    const p1IsOlder = (p1.birthOrder || 0) < (p2.birthOrder || 0) || (p1.birthDate && p2.birthDate && p1.birthDate < p2.birthDate);
    const p2IsMale = p2.gender === 'male';
    const p1IsMale = p1.gender === 'male';

    let p1CallsP2 = '';
    let p2CallsP1 = '';

    if (p1IsOlder) {
      // P1 lớn tuổi hơn -> P2 là Em
      p1CallsP2 = p2IsMale ? 'Em trai' : 'Em gái';
      p2CallsP1 = p1IsMale ? 'Anh trai' : 'Chị gái';
    } else {
      // P2 lớn tuổi hơn -> P2 là Anh/Chị
      p1CallsP2 = p2IsMale ? 'Anh trai' : 'Chị gái';
      p2CallsP1 = p1IsMale ? 'Em trai' : 'Em gái';
    }

    return {
      person1Title: p1CallsP2,
      person2Title: p2CallsP1,
      description: `${p1.fullName} và ${p2.fullName} là anh chị em ruột cùng huyết thống.`,
      relationshipType: 'sibling',
      pathDescription,
      generationDiff: 0,
      isPaternal: true,
    };
  }

  // Find Lowest Common Ancestor (LCA)
  const lcaResult = findLowestCommonAncestor(p1Id, p2Id, members);
  if (lcaResult) {
    const { ancestor, p1Depth, p2Depth, isPaternal } = lcaResult;
    const genDiff = p2Depth - p1Depth; // > 0 means P2 is higher generation (older)

    // Direct Ancestor line (Ông, Cụ, Kỵ...)
    if (p1Depth === 0) {
      // P1 is the ancestor of P2
      const depth = p2Depth;
      const { titleSenior, titleJunior } = getDirectAncestorTitles(depth, p1.gender === 'male', p2.gender === 'male', isPaternal);
      return {
        person1Title: titleJunior, // P1 calls P2
        person2Title: titleSenior, // P2 calls P1
        description: `${p1.fullName} là ${titleSenior.toLowerCase()} của ${p2.fullName} (cách ${depth} thế hệ).`,
        relationshipType: 'direct',
        pathDescription,
        generationDiff: -depth,
        isPaternal,
      };
    }

    if (p2Depth === 0) {
      // P2 is the ancestor of P1
      const depth = p1Depth;
      const { titleSenior, titleJunior } = getDirectAncestorTitles(depth, p2.gender === 'male', p1.gender === 'male', isPaternal);
      return {
        person1Title: titleSenior, // P1 calls P2 (e.g. Ông nội)
        person2Title: titleJunior, // P2 calls P1 (e.g. Cháu nội)
        description: `${p2.fullName} là ${titleSenior.toLowerCase()} của ${p1.fullName} (cách ${depth} thế hệ).`,
        relationshipType: 'direct',
        pathDescription,
        generationDiff: depth,
        isPaternal,
      };
    }

    // Collateral relatives (Chú bác cô cậu, anh em họ)
    const kinship = getCollateralKinship(p1, p2, p1Depth, p2Depth, ancestor, members, isPaternal);
    return {
      ...kinship,
      pathDescription,
    };
  }

  // In-laws check (Vợ/Chồng của người thân)
  const inlawKinship = checkInlawKinship(p1, p2, members);
  if (inlawKinship) {
    return {
      ...inlawKinship,
      pathDescription,
    };
  }

  // Default fallback calculation based on generation difference
  const genDiff = (p2.generation || 1) - (p1.generation || 1);
  let p1CallsP2 = 'Họ hàng';
  let p2CallsP1 = 'Họ hàng';

  if (genDiff > 2) {
    p1CallsP2 = p2.gender === 'male' ? 'Cụ / Cố họ' : 'Cụ bà / Cố họ';
    p2CallsP1 = 'Cháu chắt';
  } else if (genDiff === 2) {
    p1CallsP2 = p2.gender === 'male' ? 'Ông họ (Ông chú/bác)' : 'Bà họ (Bà cô/dì)';
    p2CallsP1 = 'Cháu họ';
  } else if (genDiff === 1) {
    p1CallsP2 = p2.gender === 'male' ? 'Bác / Chú họ' : 'Cô / Dì họ';
    p2CallsP1 = 'Cháu họ';
  } else if (genDiff === -1) {
    p1CallsP2 = 'Cháu họ';
    p2CallsP1 = p1.gender === 'male' ? 'Bác / Chú họ' : 'Cô / Dì họ';
  } else if (genDiff === -2) {
    p1CallsP2 = 'Cháu họ';
    p2CallsP1 = p1.gender === 'male' ? 'Ông họ' : 'Bà họ';
  } else {
    p1CallsP2 = p2.gender === 'male' ? 'Anh / Em họ' : 'Chị / Em họ';
    p2CallsP1 = p1.gender === 'male' ? 'Anh / Em họ' : 'Chị / Em họ';
  }

  return {
    person1Title: p1CallsP2,
    person2Title: p2CallsP1,
    description: `Quan hệ họ hàng thuộc dòng tộc (cách nhau ${Math.abs(genDiff)} thế hệ, ${p1.branch || 'Dòng họ'}).`,
    relationshipType: 'collateral',
    pathDescription,
    generationDiff: genDiff,
    isPaternal: true,
  };
}

function getDirectAncestorTitles(depth: number, seniorIsMale: boolean, juniorIsMale: boolean, isPaternal: boolean) {
  let titleSenior = '';
  let titleJunior = '';

  if (depth === 1) {
    titleSenior = seniorIsMale ? 'Cha (Bố)' : 'Mẹ';
    titleJunior = juniorIsMale ? 'Con trai' : 'Con gái';
  } else if (depth === 2) {
    if (isPaternal) {
      titleSenior = seniorIsMale ? 'Ông nội' : 'Bà nội';
      titleJunior = juniorIsMale ? 'Cháu nội (trai)' : 'Cháu nội (gái)';
    } else {
      titleSenior = seniorIsMale ? 'Ông ngoại' : 'Bà ngoại';
      titleJunior = juniorIsMale ? 'Cháu ngoại (trai)' : 'Cháu ngoại (gái)';
    }
  } else if (depth === 3) {
    const side = isPaternal ? 'nội' : 'ngoại';
    titleSenior = seniorIsMale ? `Cụ ông (${side})` : `Cụ bà (${side})`;
    titleJunior = `Chắt (${side})`;
  } else if (depth === 4) {
    const side = isPaternal ? 'nội' : 'ngoại';
    titleSenior = seniorIsMale ? `Kỵ ông / Tiên tổ (${side})` : `Kỵ bà (${side})`;
    titleJunior = `Chút (${side})`;
  } else {
    titleSenior = `Thủy tổ / Tiền nhân đời thứ ${depth}`;
    titleJunior = `Hậu duệ đời thứ ${depth}`;
  }

  return { titleSenior, titleJunior };
}

function getCollateralKinship(
  p1: Person,
  p2: Person,
  p1Depth: number,
  p2Depth: number,
  ancestor: Person,
  members: Record<string, Person>,
  isPaternal: boolean
): KinshipResult {
  const p1IsMale = p1.gender === 'male';
  const p2IsMale = p2.gender === 'male';

  // Same generation (p1Depth === p2Depth) -> Cousins (Anh / Chị / Em họ)
  if (p1Depth === p2Depth) {
    // Determine seniority between branches
    const p1BranchAncestor = getAncestorAtDepth(p1.id, p1Depth - 1, members);
    const p2BranchAncestor = getAncestorAtDepth(p2.id, p2Depth - 1, members);

    let p1BranchIsSenior = false;
    if (p1BranchAncestor && p2BranchAncestor) {
      const order1 = p1BranchAncestor.birthOrder || 0;
      const order2 = p2BranchAncestor.birthOrder || 0;
      if (order1 !== order2 && order1 > 0 && order2 > 0) {
        p1BranchIsSenior = order1 < order2;
      } else if (p1BranchAncestor.birthDate && p2BranchAncestor.birthDate) {
        p1BranchIsSenior = p1BranchAncestor.birthDate < p2BranchAncestor.birthDate;
      }
    }

    let p1CallsP2 = '';
    let p2CallsP1 = '';

    if (p1BranchIsSenior) {
      p1CallsP2 = p2IsMale ? 'Em họ (Em chú/bác)' : 'Em họ';
      p2CallsP1 = p1IsMale ? 'Anh họ' : 'Chị họ';
    } else {
      p1CallsP2 = p2IsMale ? 'Anh họ' : 'Chị họ';
      p2CallsP1 = p1IsMale ? 'Em họ' : 'Em họ';
    }

    return {
      person1Title: p1CallsP2,
      person2Title: p2CallsP1,
      description: `${p1.fullName} và ${p2.fullName} là anh em họ cùng có chung cụ/ông tổ là ${ancestor.fullName}.`,
      relationshipType: 'collateral',
      pathDescription: [],
      generationDiff: 0,
      isPaternal,
    };
  }

  // P1 is 1 generation lower than P2 (p1Depth = p2Depth + 1)
  // P2 is uncle/aunt of P1 (Chú, Bác, Cô, Cậu, Dì)
  if (p1Depth === p2Depth + 1 && p2Depth === 1) {
    let p1CallsP2 = '';
    const p2CallsP1 = 'Cháu ruột / Cháu họ';

    if (isPaternal) {
      // Bên nội: anh/chị/em của bố
      const p1Father = p1.fatherId ? members[p1.fatherId] : null;
      const p2IsOlderThanFather = p1Father && (
        ((p2.birthOrder || 0) < (p1Father.birthOrder || 0) && (p2.birthOrder || 0) > 0) ||
        (p2.birthDate && p1Father.birthDate && p2.birthDate < p1Father.birthDate)
      );

      if (p2IsMale) {
        p1CallsP2 = p2IsOlderThanFather ? 'Bác (Bác trai)' : 'Chú';
      } else {
        p1CallsP2 = p2IsOlderThanFather ? 'Bác gái (hoặc Cô)' : 'Cô';
      }
    } else {
      // Bên ngoại: anh/chị/em của mẹ
      if (p2IsMale) {
        p1CallsP2 = 'Cậu';
      } else {
        p1CallsP2 = 'Dì';
      }
    }

    return {
      person1Title: p1CallsP2,
      person2Title: p2CallsP1,
      description: `${p2.fullName} là ${p1CallsP2} của ${p1.fullName}. ${p1.fullName} là cháu gọi ${p2.fullName} bằng ${p1CallsP2}.`,
      relationshipType: 'collateral',
      pathDescription: [],
      generationDiff: 1,
      isPaternal,
    };
  }

  // P2 is 1 generation lower than P1 (p2Depth = p1Depth + 1)
  if (p2Depth === p1Depth + 1 && p1Depth === 1) {
    let p2CallsP1 = '';
    const p1CallsP2 = 'Cháu';

    if (isPaternal) {
      const p2Father = p2.fatherId ? members[p2.fatherId] : null;
      const p1IsOlder = p2Father && (
        ((p1.birthOrder || 0) < (p2Father.birthOrder || 0) && (p1.birthOrder || 0) > 0) ||
        (p1.birthDate && p2Father.birthDate && p1.birthDate < p2Father.birthDate)
      );
      if (p1IsMale) {
        p2CallsP1 = p1IsOlder ? 'Bác' : 'Chú';
      } else {
        p2CallsP1 = p1IsOlder ? 'Bác gái' : 'Cô';
      }
    } else {
      p2CallsP1 = p1IsMale ? 'Cậu' : 'Dì';
    }

    return {
      person1Title: p1CallsP2,
      person2Title: p2CallsP1,
      description: `${p1.fullName} là ${p2CallsP1} của ${p2.fullName}.`,
      relationshipType: 'collateral',
      pathDescription: [],
      generationDiff: -1,
      isPaternal,
    };
  }

  // 2+ generation differences: Ông bác, Ông chú, Bà cô...
  const genDiff = p2Depth - p1Depth;
  let p1CallsP2 = '';
  let p2CallsP1 = '';

  if (genDiff > 0) {
    // P2 is higher generation
    p1CallsP2 = p2IsMale ? 'Ông họ (Ông Chú/Bác)' : 'Bà họ (Bà Cô/Dì)';
    p2CallsP1 = 'Cháu họ';
  } else {
    // P1 is higher generation
    p1CallsP2 = 'Cháu họ';
    p2CallsP1 = p1IsMale ? 'Ông họ' : 'Bà họ';
  }

  return {
    person1Title: p1CallsP2,
    person2Title: p2CallsP1,
    description: `Quan hệ dòng tộc có chung tiền tổ ${ancestor.fullName} (cách nhau ${Math.abs(genDiff)} thế hệ).`,
    relationshipType: 'collateral',
    pathDescription: [],
    generationDiff: genDiff,
    isPaternal,
  };
}

function checkInlawKinship(p1: Person, p2: Person, members: Record<string, Person>): KinshipResult | null {
  // P2 is spouse of P1's child -> Con dâu / Con rể
  for (const childId of p1.childrenIds) {
    const child = members[childId];
    if (child && child.spouseIds.includes(p2.id)) {
      const p2Title = p2.gender === 'female' ? 'Con dâu' : 'Con rể';
      const p1Title = p1.gender === 'male' ? 'Bố chồng/vợ' : 'Mẹ chồng/vợ';
      return {
        person1Title: p2Title,
        person2Title: p1Title,
        description: `${p2.fullName} là ${p2Title.toLowerCase()} của ${p1.fullName} (kết hôn với ${child.fullName}).`,
        relationshipType: 'inlaw',
        pathDescription: [`${p1.fullName}`, `Cha/Mẹ của`, `${child.fullName}`, `Vợ/Chồng của`, `${p2.fullName}`],
        generationDiff: -1,
        isPaternal: true,
      };
    }
  }

  // P1 is spouse of P2's child
  for (const childId of p2.childrenIds) {
    const child = members[childId];
    if (child && child.spouseIds.includes(p1.id)) {
      const p1Title = p1.gender === 'female' ? 'Con dâu' : 'Con rể';
      const p2Title = p2.gender === 'male' ? 'Bố chồng/vợ' : 'Mẹ chồng/vợ';
      return {
        person1Title: p2Title,
        person2Title: p1Title,
        description: `${p1.fullName} là ${p1Title.toLowerCase()} của ${p2.fullName} (kết hôn với ${child.fullName}).`,
        relationshipType: 'inlaw',
        pathDescription: [`${p1.fullName}`, `Vợ/Chồng của`, `${child.fullName}`, `Con của`, `${p2.fullName}`],
        generationDiff: 1,
        isPaternal: true,
      };
    }
  }

  // P2 is spouse of P1's sibling -> Chị dâu, Anh rể, Thím, Dím...
  const p1Father = p1.fatherId ? members[p1.fatherId] : null;
  const p1Mother = p1.motherId ? members[p1.motherId] : null;
  const siblingIds = [...(p1Father?.childrenIds || []), ...(p1Mother?.childrenIds || [])].filter(id => id !== p1.id);

  for (const sibId of siblingIds) {
    const sib = members[sibId];
    if (sib && sib.spouseIds.includes(p2.id)) {
      const sibIsOlder = (sib.birthOrder || 0) < (p1.birthOrder || 0);
      let p1CallsP2 = '';
      if (sibIsOlder) {
        p1CallsP2 = p2.gender === 'female' ? 'Chị dâu' : 'Anh rể';
      } else {
        p1CallsP2 = p2.gender === 'female' ? 'Em dâu' : 'Em rể';
      }
      return {
        person1Title: p1CallsP2,
        person2Title: 'Anh/Chị/Em họ hàng',
        description: `${p2.fullName} là ${p1CallsP2} của ${p1.fullName} (bạn đời của ${sib.fullName}).`,
        relationshipType: 'inlaw',
        pathDescription: [`${p1.fullName}`, `Anh/Chị/Em với`, `${sib.fullName}`, `Vợ/Chồng với`, `${p2.fullName}`],
        generationDiff: 0,
        isPaternal: true,
      };
    }
  }

  return null;
}

function findLowestCommonAncestor(
  p1Id: string,
  p2Id: string,
  members: Record<string, Person>
): { ancestor: Person; p1Depth: number; p2Depth: number; isPaternal: boolean } | null {
  // Get all ancestors of p1 with distance
  const p1Ancestors = new Map<string, { depth: number; isPaternal: boolean }>();
  
  function getAncestors(currentId: string, depth: number, isPaternal: boolean) {
    const person = members[currentId];
    if (!person) return;
    if (!p1Ancestors.has(currentId) || (p1Ancestors.get(currentId)!.depth > depth)) {
      p1Ancestors.set(currentId, { depth, isPaternal });
    }
    if (person.fatherId) getAncestors(person.fatherId, depth + 1, depth === 0 ? true : isPaternal);
    if (person.motherId) getAncestors(person.motherId, depth + 1, depth === 0 ? false : isPaternal);
  }

  getAncestors(p1Id, 0, true);

  // Traverse p2's ancestors to find first intersection with smallest total depth
  let bestMatch: { ancestor: Person; p1Depth: number; p2Depth: number; isPaternal: boolean } | null = null;
  let minTotalDepth = Infinity;

  function checkP2Ancestors(currentId: string, depth: number) {
    const person = members[currentId];
    if (!person) return;

    if (p1Ancestors.has(currentId)) {
      const p1Info = p1Ancestors.get(currentId)!;
      const totalDepth = p1Info.depth + depth;
      if (totalDepth < minTotalDepth) {
        minTotalDepth = totalDepth;
        bestMatch = {
          ancestor: person,
          p1Depth: p1Info.depth,
          p2Depth: depth,
          isPaternal: p1Info.isPaternal,
        };
      }
    }

    if (person.fatherId) checkP2Ancestors(person.fatherId, depth + 1);
    if (person.motherId) checkP2Ancestors(person.motherId, depth + 1);
  }

  checkP2Ancestors(p2Id, 0);
  return bestMatch;
}

function getAncestorAtDepth(personId: string, targetDepth: number, members: Record<string, Person>): Person | null {
  if (targetDepth <= 0) return members[personId] || null;
  const person = members[personId];
  if (!person) return null;
  const parentId = person.fatherId || person.motherId;
  if (!parentId) return person;
  return getAncestorAtDepth(parentId, targetDepth - 1, members);
}

function findShortestRelationshipPath(
  p1Id: string,
  p2Id: string,
  members: Record<string, Person>
): PathNode[] {
  const queue: { currentId: string; path: PathNode[] }[] = [{ currentId: p1Id, path: [{ personId: p1Id, relationFromPrev: 'Gốc' }] }];
  const visited = new Set<string>([p1Id]);

  while (queue.length > 0) {
    const { currentId, path } = queue.shift()!;
    if (currentId === p2Id) {
      return path;
    }

    const person = members[currentId];
    if (!person) continue;

    // Direct connections
    const neighbors: { id: string; relation: string }[] = [];
    if (person.fatherId) neighbors.push({ id: person.fatherId, relation: 'Cha/Bố' });
    if (person.motherId) neighbors.push({ id: person.motherId, relation: 'Mẹ' });
    for (const sId of person.spouseIds) {
      neighbors.push({ id: sId, relation: 'Vợ/Chồng' });
    }
    for (const cId of person.childrenIds) {
      neighbors.push({ id: cId, relation: 'Con' });
    }

    for (const n of neighbors) {
      if (!visited.has(n.id) && members[n.id]) {
        visited.add(n.id);
        queue.push({
          currentId: n.id,
          path: [...path, { personId: n.id, relationFromPrev: n.relation }],
        });
      }
    }
  }

  return [];
}

function formatPathDescription(path: PathNode[], members: Record<string, Person>): string[] {
  if (path.length <= 1) return [];
  const descriptions: string[] = [];
  for (let i = 0; i < path.length; i++) {
    const node = path[i];
    const person = members[node.personId];
    if (!person) continue;
    if (i === 0) {
      descriptions.push(person.fullName);
    } else {
      descriptions.push(`→ [${node.relationFromPrev}] ${person.fullName}`);
    }
  }
  return descriptions;
}

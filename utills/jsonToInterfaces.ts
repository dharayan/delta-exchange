import * as fs from "fs";

interface typeMap {
  [typeName: string]: string;
}

const jsonToInterfaces = (object: any, fileName: string, mainTypeName: string, maxDepth = 20, typeMap: typeMap, objPath: string[] = [], initial = false, minObjectCheckKeysCount: number, maxArrayCheckElementsCount: number, minArrayCheckElementsCount: number, exportAll: boolean): string => {
  if (maxDepth < 0) return "any /* max depth reached */";
  try {
    if (object === true || object === false) return "boolean";
    if (typeof object === "number") return "number";
    if (typeof object === "string") return "string";
    if (typeof object === "function") return "Function";
    if (object === null) return "any /* null */";
    if (object === undefined) return "any /* undefined */";

    // TODO: create merged interface with optional fields from all elements array if required
    if (Array.isArray(object)) {
      if (!object.length)
        return "Array<any> /* no length */";
      let haveDifferentType = false;
      let prevType = "";
      const keepAllTypes = minArrayCheckElementsCount > 0 && object.length <= minArrayCheckElementsCount;
      const allTypes = object.map((el: any) => jsonToInterfaces(el, fileName, mainTypeName, maxDepth - 1, typeMap, [...objPath], false, minObjectCheckKeysCount, maxArrayCheckElementsCount, minArrayCheckElementsCount, exportAll));
      if (!keepAllTypes)
        for (const type of allTypes) {
          if (prevType && prevType !== type) {
            haveDifferentType = true;
            break
          }
          prevType = type;
        }
      if (haveDifferentType || keepAllTypes) {
        if (object.length > maxArrayCheckElementsCount) {
          const uniqueTypes = new Set(allTypes);
          return `Array<${Array.from(uniqueTypes).join(" | ")}>`
        }
        return `[${allTypes.join(", ")}]`;
      }
      return `Array<${allTypes[0]}>`;
    }

    if (typeof object === "object") {
      const keys = Object.keys(object);
      if (keys.length === 0) return "any /* empty object */";

      const previousDerivedTypes = Object.keys(typeMap)
      if (previousDerivedTypes.indexOf(mainTypeName) > -1) {
        const parentPath = objPath.slice(0, objPath.length - 1).join("_");
        mainTypeName = parentPath ? parentPath + "_" + mainTypeName : mainTypeName;
      }
      while (previousDerivedTypes.indexOf(mainTypeName) > -1) {
        mainTypeName += "_";
      }
      typeMap[mainTypeName] = "__not-derived__";

      const derivedTypes: string[] = []
      const derivedType = "{\n  " + keys.map(key => {
        if (object === object[key]) return `${key}: ${mainTypeName} /* circular reference */`
        const objType = jsonToInterfaces(object[key], fileName, key + "Type", maxDepth - 1, typeMap, [...objPath, key], false, minObjectCheckKeysCount, maxArrayCheckElementsCount, minArrayCheckElementsCount, exportAll);
        derivedTypes.push(objType)
        return `${key}: ${objType}`
      }).join("\n  ") + "\n" + "}";

      const alreadyDerivedType = Object.keys(typeMap).find(key => typeMap[key] === derivedType);
      if (alreadyDerivedType) {
        if (initial)
          fs.appendFileSync(fileName, (exportAll ? "export " : "") + `interface ${mainTypeName} ${derivedType}\n\n`);
        delete typeMap[mainTypeName];
        return alreadyDerivedType;
      }

      if (new Set(derivedTypes).size === 1 && derivedTypes.length > minObjectCheckKeysCount) {
        const keyValuePairedType = "{\n  [key: string]: " + derivedTypes[0] + "\n}";
        fs.appendFileSync(fileName, (exportAll ? "export " : "") + `interface ${mainTypeName} ${keyValuePairedType}\n\n`);
        typeMap[mainTypeName] = keyValuePairedType;
        return mainTypeName
      }

      fs.appendFileSync(fileName, (exportAll ? "export " : "") + `interface ${mainTypeName} ${derivedType}\n\n`);
      typeMap[mainTypeName] = derivedType;
      return mainTypeName;
    }
  } catch (e) {
    console.error(e);
  }
  return "any /* unknown */";
}

const generateType = (json: any, fileName: string, mainTypeName = "DefaultType", maxDepth = 20, minObjectCheckKeysCount = 10, maxArrayCheckElementsCount = 20, minArrayCheckElementsCount = -1, exportAll = true, exportMainType = true, exportDefault = true) => {
  fs.writeFileSync(fileName, `// auto generated types of ${mainTypeName}\n`);
  try {
    const object = typeof json === "string" ? JSON.parse(json) : json
    const typeMap: typeMap = {};
    const generateType = jsonToInterfaces(object, fileName, mainTypeName, maxDepth, typeMap, [], true, minObjectCheckKeysCount, maxArrayCheckElementsCount, minArrayCheckElementsCount, exportAll);
    if (exportMainType)
      if (!Object.keys(typeMap).length)
        fs.appendFileSync(fileName, `export interface ${mainTypeName} {}\n\n`); // TODO: need better solution
    if (exportDefault)
      fs.appendFileSync(fileName, `export default ${mainTypeName};\n`);
    return generateType;
  } catch (e) {
    console.error(e);
    if (exportMainType)
      fs.appendFileSync(fileName, `export interface ${mainTypeName} {};\n`);
    if (exportDefault)
      fs.appendFileSync(fileName, `export default ${mainTypeName};\n`);
  }
  return "any /* unknown */";
}

export default generateType;

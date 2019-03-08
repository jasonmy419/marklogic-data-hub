/**
  Copyright 2012-2019 MarkLogic Corporation

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/
'use strict';
const cachedModules = {};

class HubUtils {
  constructor(config = null) {
    if(!config) {
      config = require("/com.marklogic.hub/config.sjs");
    }
    this.config = config;
  }

  getConfig() {
    return this.config;
  }

  writeDocument(docUri, content, permissions, collections, database) {
    xdmp.eval(`xdmp.documentInsert(docUri, content, {permissions: ${permissions}, collections })`,
    {
    content: content,
    docUri:docUri,
    permissions:permissions,
    collections: this.normalizeToSequence(collections)
    },
    {
     database: xdmp.database(database),
     commit: 'auto',
     update: 'true',
     ignoreAmps: true
    })
  }

  writeDocuments(writeQueue, permissions = 'xdmp.defaultPermissions()', collections, database){
    xdmp.eval(`
    for (let docUri in writeQueue) {
      xdmp.documentInsert(docUri, writeQueue[docUri].content, {permissions: ${permissions}, collections});
    }`,
      {
        writeQueue,
        permissions,
        collections: collections || []
      },
      {
        database: xdmp.database(database),
        commit: 'auto',
        update: 'true',
        ignoreAmps: true
      })
  }

  deleteDocument(docUri, database){
    xdmp.eval('xdmp.documentDelete("' + docUri + '")',
    {
      docUri:docUri
    },
    {
      database: xdmp.database(database),
      commit: 'auto',
      update: 'true',
      ignoreAmps: true
    })
  }

  queryLatest(queryFunction, database) {
    return xdmp.invokeFunction(queryFunction, { commit: 'auto', update: 'false', ignoreAmps: true, database: database ? xdmp.database(database): xdmp.database()})
  }

  invoke(moduleUri, parameters, user = xdmp.getCurrentUser(), database) {
    xdmp.invoke(moduleUri, parameters, {
      ignoreAmps: true,
      database: database ? xdmp.database(database): xdmp.database(),
      user: xdmp.user(user)
    })
  }
  /**
  * Generate and return a UUID
  */
  uuid() {
    var uuid = "", i, random;
    for (i = 0; i < 32; i++) {
      random = Math.random() * 16 | 0;

      if (i == 8 || i == 12 || i == 16 || i == 20) {
        uuid += "-"
      }
      uuid += (i == 12 ? 4 : (i == 16 ? (random & 3 | 8) : random)).toString(16);
    }
    return uuid;
  }

  /**
  * Capitalize first letter of a string
  */
 capitalize(str) {
  return (str) ? str.charAt(0).toUpperCase() + str.slice(1) : str;
 }

 retrieveModuleLibrary(moduleLibraryURI) {
   if (!cachedModules[moduleLibraryURI]) {
     cachedModules[moduleLibraryURI] = require(moduleLibraryURI);
   }
   return cachedModules[moduleLibraryURI];
 }

  normalizeToSequence(value) {
   if (value instanceof Sequence) {
     return value;
   } else if (Array.isArray(value)) {
     return Sequence.from(value);
   } else {
     return Sequence.from([value]);
   }
 }

  normalizeToArray(value) {
    if (value instanceof Sequence) {
      return value.toArray();
    } else if (Array.isArray(value)) {
      return value;
    } else {
      return [value];
    }
  }

  cloneInstance(instance) {
     let prototype = Object.getPrototypeOf(instance);
     let keys = Object.getOwnPropertyNames(instance).concat(Object.getOwnPropertyNames(prototype));
     let newInstance = {};
     for (let key of keys) {
       newInstance[key] = instance[key];
     }
     return newInstance;
  }
 
}

module.exports = HubUtils;
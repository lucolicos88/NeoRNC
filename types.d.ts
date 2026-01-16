/**
 * Declarações de tipos para Google Apps Script
 * Deploy 129: Ajuda o VSCode a reconhecer APIs do GAS
 */

// Google Apps Script Services
declare var SpreadsheetApp: GoogleAppsScript.Spreadsheet.SpreadsheetApp;
declare var DriveApp: GoogleAppsScript.Drive.DriveApp;
declare var MailApp: GoogleAppsScript.Mail.MailApp;
declare var Session: GoogleAppsScript.Base.Session;
declare var Logger: GoogleAppsScript.Base.Logger;
declare var Utilities: GoogleAppsScript.Utilities.Utilities;
declare var ContentService: GoogleAppsScript.Content.ContentService;
declare var HtmlService: GoogleAppsScript.HTML.HtmlService;
declare var LockService: GoogleAppsScript.Lock.LockService;
declare var CacheService: GoogleAppsScript.Cache.CacheService;
declare var PropertiesService: GoogleAppsScript.Properties.PropertiesService;
declare var UrlFetchApp: GoogleAppsScript.URL_Fetch.UrlFetchApp;
declare var Drive: GoogleAppsScript.Drive;
declare var Blob: GoogleAppsScript.Base.Blob;
declare var Browser: GoogleAppsScript.Base.Browser;

// Namespace para tipos do Google Apps Script
declare namespace GoogleAppsScript {
  namespace Spreadsheet {
    interface SpreadsheetApp {
      getActiveSpreadsheet(): Spreadsheet;
      openById(id: string): Spreadsheet;
      getUi(): any;
      create(name: string): Spreadsheet;
    }
    interface Spreadsheet {
      getSheetByName(name: string): Sheet | null;
      getSheets(): Sheet[];
      insertSheet(name: string): Sheet;
      getId(): string;
      getName(): string;
      getUrl(): string;
    }
    interface Sheet {
      getDataRange(): Range;
      getRange(row: number, column: number, numRows?: number, numColumns?: number): Range;
      getRange(a1Notation: string): Range;
      getLastRow(): number;
      getLastColumn(): number;
      getName(): string;
      appendRow(rowContents: any[]): Sheet;
      deleteRow(rowPosition: number): void;
      insertRowAfter(afterPosition: number): Sheet;
      getMaxRows(): number;
      getMaxColumns(): number;
    }
    interface Range {
      getValues(): any[][];
      getValue(): any;
      setValues(values: any[][]): Range;
      setValue(value: any): Range;
      getDisplayValues(): string[][];
      getNumRows(): number;
      getNumColumns(): number;
      getRow(): number;
      getColumn(): number;
    }
  }
  namespace Drive {
    interface DriveApp {
      getFolderById(id: string): Folder;
      getFileById(id: string): File;
      createFile(blob: any): File;
      createFolder(name: string): Folder;
      getRootFolder(): Folder;
    }
    interface Folder {
      getId(): string;
      getName(): string;
      getFiles(): FileIterator;
      getFolders(): FolderIterator;
      createFile(blob: any): File;
      createFolder(name: string): Folder;
    }
    interface File {
      getId(): string;
      getName(): string;
      getUrl(): string;
      getBlob(): any;
      setTrashed(trashed: boolean): File;
      getSize(): number;
      getMimeType(): string;
    }
    interface FileIterator {
      hasNext(): boolean;
      next(): File;
    }
    interface FolderIterator {
      hasNext(): boolean;
      next(): Folder;
    }
  }
  interface Drive {
    Files: {
      insert(file: any, blob?: any, options?: any): any;
      update(file: any, fileId: string, blob?: any, options?: any): any;
      get(fileId: string): any;
      remove(fileId: string): void;
    };
  }
  namespace Mail {
    interface MailApp {
      sendEmail(options: {
        to: string;
        subject: string;
        htmlBody?: string;
        body?: string;
        name?: string;
        replyTo?: string;
        attachments?: any[];
        cc?: string;
        bcc?: string;
      }): void;
      sendEmail(to: string, subject: string, body: string, options?: any): void;
      getRemainingDailyQuota(): number;
    }
  }
  namespace Base {
    interface Session {
      getActiveUser(): User;
      getEffectiveUser(): User;
      getScriptTimeZone(): string;
    }
    interface User {
      getEmail(): string;
    }
    interface Logger {
      log(data: any): Logger;
      clear(): void;
      getLog(): string;
    }
    interface Blob {
      getBytes(): number[];
      getContentType(): string;
      getName(): string;
      setContentType(contentType: string): Blob;
      setName(name: string): Blob;
    }
    interface Browser {
      msgBox(msg: string): string;
      inputBox(msg: string): string;
    }
  }
  namespace Utilities {
    interface Utilities {
      formatDate(date: Date, timeZone: string, format: string): string;
      newBlob(data: any, contentType?: string, name?: string): any;
      base64Encode(data: any): string;
      base64Decode(encoded: string): number[];
      getUuid(): string;
      sleep(milliseconds: number): void;
    }
  }
  namespace Content {
    interface ContentService {
      createTextOutput(content?: string): TextOutput;
      MimeType: {
        JSON: string;
        TEXT: string;
        HTML: string;
        XML: string;
      };
    }
    interface TextOutput {
      setMimeType(mimeType: string): TextOutput;
      getContent(): string;
      setContent(content: string): TextOutput;
    }
  }
  namespace HTML {
    interface HtmlService {
      createHtmlOutput(html?: string): HtmlOutput;
      createHtmlOutputFromFile(filename: string): HtmlOutput;
      createTemplateFromFile(filename: string): HtmlTemplate;
    }
    interface HtmlOutput {
      getContent(): string;
      setContent(content: string): HtmlOutput;
      setTitle(title: string): HtmlOutput;
      setXFrameOptionsMode(mode: any): HtmlOutput;
    }
    interface HtmlTemplate {
      evaluate(): HtmlOutput;
    }
  }
  namespace Lock {
    interface LockService {
      getScriptLock(): Lock;
      getDocumentLock(): Lock;
    }
    interface Lock {
      tryLock(timeoutInMillis: number): boolean;
      releaseLock(): void;
      waitLock(timeoutInMillis: number): void;
      hasLock(): boolean;
    }
  }
  namespace Cache {
    interface CacheService {
      getScriptCache(): Cache;
      getDocumentCache(): Cache;
      getUserCache(): Cache;
    }
    interface Cache {
      get(key: string): string | null;
      put(key: string, value: string, expirationInSeconds?: number): void;
      remove(key: string): void;
      getAll(keys: string[]): { [key: string]: string };
      putAll(values: { [key: string]: string }, expirationInSeconds?: number): void;
      removeAll(keys: string[]): void;
    }
  }
  namespace Properties {
    interface PropertiesService {
      getScriptProperties(): Properties;
      getDocumentProperties(): Properties;
      getUserProperties(): Properties;
    }
    interface Properties {
      getProperty(key: string): string | null;
      setProperty(key: string, value: string): Properties;
      deleteProperty(key: string): Properties;
      getProperties(): { [key: string]: string };
      setProperties(properties: { [key: string]: string }, deleteAllOthers?: boolean): Properties;
    }
  }
  namespace URL_Fetch {
    interface UrlFetchApp {
      fetch(url: string, params?: any): HTTPResponse;
      getRequest(url: string, params?: any): any;
    }
    interface HTTPResponse {
      getContentText(): string;
      getResponseCode(): number;
      getHeaders(): { [key: string]: string };
      getBlob(): any;
    }
  }
}

// Variáveis globais do projeto
declare var CONFIG: {
  SPREADSHEET_ID: string;
  DRIVE_FOLDER_ID: string;
  VERSION: string;
  BUILD_DATE: string;
  DEBUG_MODE: boolean;
  ENVIRONMENT: string;
  SHEETS: { [key: string]: string };
  STATUS_PIPELINE: { [key: string]: string };
  LIMITS: { [key: string]: number };
};

declare var Database: {
  findData: (sheetName: string, filters?: any) => any[];
  insertData: (sheetName: string, data: any) => any;
  updateData: (sheetName: string, filters: any, updates: any) => any;
  deleteData: (sheetName: string, filters: any) => any;
  getAllData: (sheetName: string) => any[];
};

declare var PermissionsManager: {
  getUserRoles: (email: string) => string[];
  getUserSetor: (email: string) => string[];
  getUserPermissions: (email: string) => any;
  canEditSection: (email: string, section: string) => boolean;
  checkPermissionToSave: (email: string, data: any) => any;
  addUserRole: (email: string, role: string, setor?: any) => any;
  removeUserRole: (email: string, role: string) => any;
  updateUserSetor: (email: string, novosSetores: any) => any;
  updateUserEmailNotificacoes: (email: string, emailNotificacoes: string) => any;
  getAllUsers: () => any[];
  isAdmin: (email: string) => boolean;
};

declare var NotificationManager: {
  getUsersBySetor: (setor: string) => string[];
  getAdminUsers: () => string[];
  getRncLink: (rncNumber: string) => string;
  notifyRncCreated: (rncNumber: string, rncData: any) => any;
  notifyRncUpdated: (rncNumber: string, rncData: any, changes: any) => any;
  notifyStatusChanged: (rncNumber: string, oldStatus: string, newStatus: string) => any;
  notifyFinanceiroCortesia: (rncNumber: string, rncData: any) => any;
  manualNotify: (rncNumber: string, recipients: string[], subject: string, message: string) => any;
};

declare var FileManager: {
  uploadFile: (base64Data: string, fileName: string, mimeType: string, folderId?: string) => any;
  deleteFile: (fileId: string) => any;
  getFileUrl: (fileId: string) => string;
  getFileThumbnail: (fileId: string) => string;
};

declare var RncOperations: {
  createRnc: (data: any) => any;
  updateRnc: (rncNumber: string, data: any) => any;
  getRnc: (rncNumber: string) => any;
  getAllRncs: () => any[];
  deleteRnc: (rncNumber: string) => any;
};

declare var HistoricoManager: {
  registrarHistorico: (rncNumber: string, action: string, details: any) => any;
  getHistorico: (rncNumber: string) => any[];
};

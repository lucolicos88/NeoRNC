#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para aplicar correções do Deploy 31
"""

import re

def fix_06_rncoperations():
    """Corrige código duplicado em 06.RncOperations.js"""

    with open('06.RncOperations.js', 'r', encoding='utf-8') as f:
        content = f.read()

    # Encontrar e corrigir os 3 returns
    # Padrão: após dateFields.forEach até os 3 returns

    pattern = r"(dateFields\.forEach\(function\(fieldName\) \{[\s\S]*?\}\);)\s*// Buscar anexos\s*rnc\._anexos[\s\S]*?return rnc;\s*// === NORMALIZAÇÃO[\s\S]*?return rnc;\s*return rnc;"

    replacement = r"""\1

// === NORMALIZAÇÃO: CONVERTER NÚMEROS EM STRINGS PARA SELECTS ===
var selectFields = [
  'Filial de Origem',
  'Código do Cliente',
  'Telefone do Cliente'
];

selectFields.forEach(function(fieldName) {
  if (rnc[fieldName] !== undefined && rnc[fieldName] !== null && typeof rnc[fieldName] === 'number') {
    rnc[fieldName] = String(rnc[fieldName]);
  }
});

// Buscar anexos
rnc._anexos = FileManager.getAnexosRnc(rncNumber);

// ✅ CORRIGIDO Deploy 31: Apenas UM return (eram 3 antes - Problema #1)
return rnc;"""

    content = re.sub(pattern, replacement, content)

    with open('06.RncOperations.js', 'w', encoding='utf-8') as f:
        f.write(content)

    print("✅ 06.RncOperations.js corrigido")

def fix_03_database():
    """Adiciona clearCache() em 03.Database.js"""

    with open('03.Database.js', 'r', encoding='utf-8') as f:
        content = f.read()

    # Procurar pelo return { no final do módulo
    if 'clearCache: clearCache' not in content:
        # Adicionar função antes do return
        clear_cache_function = """
  /**
   * ✅ NOVO Deploy 31: Limpa cache completo (Problema #10)
   */
  function clearCache() {
    sheetCache = {};
    spreadsheetCache = null;

    var cache = CacheService.getScriptCache();
    try {
      cache.remove('config_');
      cache.remove('list_');
      cache.remove('rnc_');
    } catch(e) {
      // Ignorar erros de cache
    }

    Logger.logInfo('CACHE_CLEARED', {
      timestamp: new Date().toISOString()
    });

    return { success: true, message: 'Cache limpo com sucesso' };
  }

  // API Pública
  return {"""

        content = content.replace('  // API Pública\n  return {', clear_cache_function)

        # Adicionar clearCache na API
        content = content.replace(
            '    deleteData: deleteData\n  };',
            '    deleteData: deleteData,\n    clearCache: clearCache  // ✅ Deploy 31\n  };'
        )

        with open('03.Database.js', 'w', encoding='utf-8') as f:
            f.write(content)

        print("✅ 03.Database.js corrigido")
    else:
        print("⚠️  03.Database.js já possui clearCache")

def fix_11_printrnc():
    """Remove magic numbers de 11.PrintRNC.js"""

    with open('11.PrintRNC.js', 'r', encoding='utf-8') as f:
        content = f.read()

    # Correção 1: rangeNotation
    content = content.replace(
        "var rangeNotation = 'A1:H26';",
        "var rangeNotation = CONFIG.PRINT.RANGE_START + ':' + CONFIG.PRINT.RANGE_END; // ✅ Deploy 31"
    )

    # Correção 2: printRangeColumnIndex
    content = content.replace(
        "var printRangeColumnIndex = 10;",
        "var printRangeColumnIndex = CONFIG.PRINT.COLUMN_INDEX_PRINT_RANGE; // ✅ Deploy 31"
    )

    with open('11.PrintRNC.js', 'w', encoding='utf-8') as f:
        f.write(content)

    print("✅ 11.PrintRNC.js corrigido")

def fix_06_string_comparison():
    """Corrige comparação de strings em determineNewStatus()"""

    with open('06.RncOperations.js', 'r', encoding='utf-8') as f:
        content = f.read()

    # Encontrar e corrigir a comparação
    old_comparison = "if (tipoRnc && (tipoRnc.toLowerCase().includes('não procede')))"

    new_comparison = """// ✅ CORRIGIDO Deploy 31: Comparação exata (Problema #6)
    var naoProcede = ['não procede', 'nao procede'];
    if (tipoRnc && naoProcede.some(function(val) {
      return tipoRnc.toLowerCase().trim() === val;
    }))"""

    if old_comparison in content:
        content = content.replace(old_comparison, new_comparison)

        with open('06.RncOperations.js', 'w', encoding='utf-8') as f:
            f.write(content)

        print("✅ 06.RncOperations.js - comparação de strings corrigida")
    else:
        print("⚠️  Comparação de strings não encontrada ou já corrigida")

if __name__ == '__main__':
    print("Iniciando correcoes do Deploy 31...\n")

    try:
        fix_06_rncoperations()
    except Exception as e:
        print(f"❌ Erro em 06.RncOperations.js: {e}")

    try:
        fix_03_database()
    except Exception as e:
        print(f"❌ Erro em 03.Database.js: {e}")

    try:
        fix_11_printrnc()
    except Exception as e:
        print(f"❌ Erro em 11.PrintRNC.js: {e}")

    try:
        fix_06_string_comparison()
    except Exception as e:
        print(f"❌ Erro em comparação de strings: {e}")

    print("\nCorrecoes concluidas!")

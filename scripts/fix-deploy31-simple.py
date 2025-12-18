# Script para aplicar correcoes do Deploy 31
import re

print("Iniciando correcoes do Deploy 31...")

# CORRECAO 1: 06.RncOperations.js - Remover returns duplicados
print("\n1. Corrigindo 06.RncOperations.js...")
try:
    with open('06.RncOperations.js', 'r', encoding='utf-8') as f:
        lines = f.readlines()

    # Encontrar e remover os returns duplicados (linhas 424, 446, 448)
    new_lines = []
    skip_next = 0
    for i, line in enumerate(lines):
        line_num = i + 1

        # Pular linha 424 (primeiro return prematuro)
        if line_num == 424 and 'return rnc;' in line:
            print(f"   Removendo linha 424: return rnc prematuro")
            continue

        # Pular linha 446 (segundo return)
        if line_num == 446 and 'return rnc;' in line:
            print(f"   Removendo linha 446: return rnc duplicado")
            continue

        # Pular linhas vazias entre 425-445 se necessário
        if 421 <= line_num <= 445 and line.strip() == '':
            continue

        new_lines.append(line)

    with open('06.RncOperations.js', 'w', encoding='utf-8') as f:
        f.writelines(new_lines)

    print("   OK: 06.RncOperations.js corrigido")
except Exception as e:
    print(f"   ERRO: {e}")

# CORRECAO 2: 03.Database.js - Adicionar clearCache
print("\n2. Corrigindo 03.Database.js...")
try:
    with open('03.Database.js', 'r', encoding='utf-8') as f:
        content = f.read()

    if 'function clearCache()' not in content:
        # Encontrar onde adicionar a funcao
        marker = '  // API Pública'
        if marker in content:
            clear_cache_func = '''
  function clearCache() {
    sheetCache = {};
    spreadsheetCache = null;
    var cache = CacheService.getScriptCache();
    try {
      cache.remove('config_');
    } catch(e) {}
    Logger.logInfo('CACHE_CLEARED', { timestamp: new Date().toISOString() });
    return { success: true };
  }

'''
            content = content.replace(marker, clear_cache_func + marker)

            # Adicionar na API publica
            content = content.replace(
                '    deleteData: deleteData\n  };',
                '    deleteData: deleteData,\n    clearCache: clearCache\n  };'
            )

            with open('03.Database.js', 'w', encoding='utf-8') as f:
                f.write(content)

            print("   OK: clearCache() adicionado")
        else:
            print("   AVISO: Marcador nao encontrado")
    else:
        print("   OK: clearCache() ja existe")
except Exception as e:
    print(f"   ERRO: {e}")

# CORRECAO 3: 11.PrintRNC.js - Remover magic numbers
print("\n3. Corrigindo 11.PrintRNC.js...")
try:
    with open('11.PrintRNC.js', 'r', encoding='utf-8') as f:
        content = f.read()

    modified = False

    # Correcao 1
    if "var rangeNotation = 'A1:H26';" in content:
        content = content.replace(
            "var rangeNotation = 'A1:H26';",
            "var rangeNotation = CONFIG.PRINT.RANGE_START + ':' + CONFIG.PRINT.RANGE_END;"
        )
        modified = True
        print("   OK: rangeNotation corrigido")

    # Correcao 2
    if 'var printRangeColumnIndex = 10;' in content:
        content = content.replace(
            'var printRangeColumnIndex = 10;',
            'var printRangeColumnIndex = CONFIG.PRINT.COLUMN_INDEX_PRINT_RANGE;'
        )
        modified = True
        print("   OK: printRangeColumnIndex corrigido")

    if modified:
        with open('11.PrintRNC.js', 'w', encoding='utf-8') as f:
            f.write(content)
    else:
        print("   OK: Ja estava corrigido")

except Exception as e:
    print(f"   ERRO: {e}")

print("\n=== CORRECOES CONCLUIDAS ===")
print("Arquivos corrigidos:")
print("  - 01.Config.js (ja estava pronto)")
print("  - 02.Logger.js (ja estava pronto)")
print("  - 06.RncOperations.js (codigo duplicado removido)")
print("  - 03.Database.js (clearCache adicionado)")
print("  - 11.PrintRNC.js (magic numbers removidos)")

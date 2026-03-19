// Variáveis globais
let cartuchos = [];
let cartuchosFiltrados = [];
let mapaTermos = new Map();
let fuse;
let searchItems = [];

// Filtros ativos
let filtroMarca = null;
let filtroTipo = null;

// URLs dos logos
const logos = [
    { marca: 'HP', url: 'https://static.kalunga.com.br/img/hp.png' },
    { marca: 'EPSON', url: 'https://static.kalunga.com.br/img/epson.png' },
    { marca: 'BROTHER', url: 'https://static.kalunga.com.br/img/brother.png' },
    { marca: 'CANON', url: 'https://static.kalunga.com.br/img/canon.png' },
    { marca: 'SAMSUNG', url: 'https://static.kalunga.com.br/img/samsung.png' }
];

// Elementos DOM
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const resultsContainer = document.getElementById('resultsContainer');
const resultsSection = document.getElementById('resultsSection');
const impressorasContainer = document.getElementById('impressorasContainer');
const welcomeMessage = document.getElementById('welcomeMessage');
const resultsCount = document.getElementById('resultsCount');
const modalBody = document.getElementById('modalBody');
const modelosModal = new bootstrap.Modal(document.getElementById('modelosModal'));
const autocompleteDropdown = document.getElementById('autocompleteDropdown');
const filtersSection = document.getElementById('filtersSection');
const brandsGrid = document.getElementById('brandsGrid');
const brandTypesContainer = document.getElementById('brandTypesContainer');

// Elementos para Minhas Impressoras
const myPrintersSection = document.getElementById('myPrintersSection');
const myPrintersContainer = document.getElementById('myPrintersContainer');
const myPrintersEmpty = document.getElementById('myPrintersEmpty');
const STORAGE_KEY = 'kalunga_my_printers';

// Variável para controlar qual sublista abrir após busca
let modeloParaAbrir = null;

// Ordem personalizada para os tipos de filtro
const ordemTipos = ['Garrafa', 'Cartucho', 'Toner', 'Cabeça', 'Cilindro'];

// Função para formatar preço no padrão brasileiro (R$ 99,90)
function formatarPreco(valor) {
    if (!valor) return 'R$ 99,90';
    let str = valor.toString().trim();
    str = str.replace(/R\$\s*/i, '');
    str = str.replace(',', '.');
    str = str.replace(/[^\d.-]/g, '');
    let num = parseFloat(str);
    if (isNaN(num)) return 'R$ 99,90';
    return 'R$ ' + num.toFixed(2).replace('.', ',');
}

// Função para limpar códigos SKU entre parênteses
function limparCodigoSKU(texto) {
    if (!texto) return texto;
    return texto.replace(/\s*\(\d+\)/g, '').trim();
}

// Função para renderizar os filtros de marca (apenas logos)
function renderizarMarcas() {
    brandsGrid.innerHTML = '';

    logos.forEach(logo => {
        const brandColumn = document.createElement('div');
        brandColumn.className = 'brand-column';

        const img = document.createElement('img');
        img.src = logo.url;
        img.alt = logo.marca;
        img.title = logo.marca;
        img.className = 'brand-logo';
        img.dataset.marca = logo.marca;
        img.style.opacity = '1';
        img.style.filter = 'none';
        img.addEventListener('click', () => aplicarFiltroMarca(logo.marca));

        brandColumn.appendChild(img);
        brandsGrid.appendChild(brandColumn);
    });

    if (filtroMarca) {
        atualizarOpacidadeMarcas();
    }
}

function atualizarOpacidadeMarcas() {
    document.querySelectorAll('.brand-logo').forEach(logo => {
        if (filtroMarca && logo.dataset.marca !== filtroMarca) {
            logo.style.opacity = '0.4';
            logo.style.filter = 'grayscale(80%)';
        } else {
            logo.style.opacity = '1';
            logo.style.filter = 'none';
        }
    });
}

// Função para ordenar os tipos conforme a lista personalizada
function ordenarTipos(tiposArray) {
    return tiposArray.sort((a, b) => {
        const indexA = ordemTipos.indexOf(a);
        const indexB = ordemTipos.indexOf(b);
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        return a.localeCompare(b);
    });
}

function renderizarTiposParaMarca(marca) {
    const tiposSet = new Set();
    cartuchos.filter(item => item.marca.toUpperCase() === marca).forEach(item => {
        if (item.tipo) tiposSet.add(item.tipo);
    });
    let tiposUnicos = Array.from(tiposSet);
    tiposUnicos = ordenarTipos(tiposUnicos);

    brandTypesContainer.innerHTML = '';
    if (tiposUnicos.length === 0) return;

    tiposUnicos.forEach(tipo => {
        const link = document.createElement('a');
        link.className = 'type-link';
        link.textContent = tipo;
        link.dataset.tipo = tipo;
        link.addEventListener('click', (e) => {
            e.stopPropagation();
            aplicarFiltroTipo(tipo);
        });
        brandTypesContainer.appendChild(link);
    });

    if (filtroTipo) {
        const linkAtivo = Array.from(brandTypesContainer.querySelectorAll('.type-link')).find(link => link.dataset.tipo === filtroTipo);
        if (linkAtivo) linkAtivo.classList.add('active');
    }
}

function limparTipos() {
    brandTypesContainer.innerHTML = '';
}

function aplicarFiltroMarca(marca) {
    // Se a marca clicada já está ativa, desativa (toggle) e esconde as impressoras
    if (filtroMarca === marca) {
        filtroMarca = null;
        filtroTipo = null;
        // Restaura todas as marcas para vibrantes
        document.querySelectorAll('.brand-logo').forEach(logo => {
            logo.style.opacity = '1';
            logo.style.filter = 'none';
        });
        limparTipos();
        cartuchosFiltrados = [...cartuchos];

        // Esconde a lista de impressoras e mostra a mensagem de boas-vindas
        impressorasContainer.style.display = 'none';
        resultsSection.style.display = 'none';
        welcomeMessage.style.display = 'block';
        welcomeMessage.innerHTML = `
            <i class="fas fa-print" style="font-size: 4rem; color: var(--gray-300); margin-bottom: 1rem;"></i>
            <h3 style="color: var(--secondary); font-weight: 300;">Selecione uma marca ou faça uma busca</h3>
            <p class="text-muted">Escolha uma marca acima ou digite o modelo da sua impressora.</p>
        `;
        return;
    }

    document.querySelectorAll('.brand-logo').forEach(logo => logo.classList.remove('active'));
    filtroTipo = null;

    filtroMarca = marca;

    atualizarOpacidadeMarcas();
    renderizarTiposParaMarca(marca);

    aplicarFiltros();
}

function aplicarFiltroTipo(tipo) {
    if (filtroTipo === tipo) {
        filtroTipo = null;
        document.querySelectorAll('.type-link').forEach(link => link.classList.remove('active'));
        aplicarFiltros();
        return;
    }

    document.querySelectorAll('.type-link').forEach(link => link.classList.remove('active'));
    filtroTipo = tipo;

    const linkAtivo = Array.from(brandTypesContainer.querySelectorAll('.type-link')).find(link => link.dataset.tipo === tipo);
    if (linkAtivo) linkAtivo.classList.add('active');

    aplicarFiltros();
}

function aplicarFiltros() {
    if (!cartuchos.length) return;

    cartuchosFiltrados = cartuchos.filter(item => {
        let matchMarca = true;
        let matchTipo = true;

        if (filtroMarca) {
            matchMarca = item.marca.toUpperCase() === filtroMarca;
        }
        if (filtroTipo) {
            matchTipo = item.tipo === filtroTipo;
        }
        return matchMarca && matchTipo;
    });

    if (cartuchosFiltrados.length === 0) {
        resultsSection.style.display = 'none';
        impressorasContainer.style.display = 'none';
        welcomeMessage.style.display = 'block';
        welcomeMessage.innerHTML = `
            <i class="fas fa-filter" style="font-size: 4rem; color: var(--gray-300); margin-bottom: 1rem;"></i>
            <h3 style="color: var(--secondary);">Nenhum produto com os filtros selecionados</h3>
            <p class="text-muted">Tente limpar os filtros ou escolher outras opções.</p>
        `;
        return;
    }

    exibirImpressoras();
}

// Função para mapear cor com suporte a combos e múltiplas cores
function mapearCor(textoCor) {
    if (!textoCor || textoCor.trim() === '') {
        return { tipo: 'simples', cor: 'Cor não identificada', icone: 'fa-tint', estilo: 'color: #999999;' };
    }
    const corLower = textoCor.trim().toLowerCase();

    if (corLower.includes('combo') || corLower.includes('kit') || corLower.includes('c/4') || corLower.includes('4 cores')) {
        return {
            tipo: 'combo',
            cores: [
                { cor: 'Preto', icone: 'fa-tint', estilo: 'color: #000000;' },
                { cor: 'Ciano', icone: 'fa-tint', estilo: 'color: #00FFFF;' },
                { cor: 'Magenta', icone: 'fa-tint', estilo: 'color: #FF00FF;' },
                { cor: 'Amarelo', icone: 'fa-tint', estilo: 'color: #FFFF00;' }
            ]
        };
    }

    if (corLower.includes('color') || corLower.includes('tricolor') || corLower.includes('colorido')) {
        return {
            tipo: 'colorido',
            cores: [
                { cor: 'Ciano', icone: 'fa-tint', estilo: 'color: #00FFFF;' },
                { cor: 'Magenta', icone: 'fa-tint', estilo: 'color: #FF00FF;' },
                { cor: 'Amarelo', icone: 'fa-tint', estilo: 'color: #FFFF00;' }
            ]
        };
    } else if (corLower.includes('preto') || corLower.includes('black') || corLower.includes('pb')) {
        return { tipo: 'simples', cor: 'Preto', icone: 'fa-tint', estilo: 'color: #000000;' };
    } else if (corLower.includes('ciano') || corLower.includes('cyan')) {
        return { tipo: 'simples', cor: 'Ciano', icone: 'fa-tint', estilo: 'color: #00FFFF;' };
    } else if (corLower.includes('magenta')) {
        return { tipo: 'simples', cor: 'Magenta', icone: 'fa-tint', estilo: 'color: #FF00FF;' };
    } else if (corLower.includes('amarelo') || corLower.includes('yellow')) {
        return { tipo: 'simples', cor: 'Amarelo', icone: 'fa-tint', estilo: 'color: #FFFF00;' };
    } else {
        return { tipo: 'simples', cor: textoCor.trim(), icone: 'fa-tint', estilo: 'color: #999999;' };
    }
}

// Processar dados do Excel (13 colunas: A até M)
function processarDados(rows) {
    if (rows.length === 0) return;

    const hasHeader = true;
    let startIndex = hasHeader ? 1 : 0;

    const inactiveKeywords = ['descontinuado', 'inativo', 'fora de linha', 'obsoleto', 'cancelado'];

    cartuchos = [];
    let ignorados = 0;

    for (let i = startIndex; i < rows.length; i++) {
        const row = rows[i];
        if (row.length >= 7) {
            const cartucho = {
                cartucho: row[0] ? row[0].toString().trim() : '',
                marca: row[1] ? row[1].toString().trim() : '',
                tipo: row[2] ? row[2].toString().trim() : '',
                sku: row[3] ? row[3].toString().trim() : '',
                status: row[4] ? row[4].toString().trim() : '',
                familia: row[5] ? row[5].toString().trim() : '',
                modelo: row[6] ? row[6].toString().trim() : '',
                equipamento: row[7] ? row[7].toString().trim() : '',
                foto_impressora: row[8] ? row[8].toString().trim() : '',
                preco: row[9] ? row[9].toString().trim() : '',
                parcela: row[10] ? row[10].toString().trim() : '',
                cor: row[11] ? row[11].toString().trim() : '',
                paginas: row[12] ? row[12].toString().trim() : ''
            };

            if (cartucho.cartucho || cartucho.sku) {
                const statusLower = cartucho.status.toLowerCase();
                const isInactive = inactiveKeywords.some(keyword => statusLower.includes(keyword));

                if (isInactive) {
                    ignorados++;
                    continue;
                }
                cartuchos.push(cartucho);
            }
        }
    }

    console.log(`Dados carregados: ${cartuchos.length} registros ativos, ${ignorados} ignorados.`);

    if (ignorados > 0) {
        showAlert(`${ignorados} produto(s) inativo(s) foram ignorados.`);
    }

    cartuchosFiltrados = [...cartuchos];
    construirMapaTermos();
    prepararFuse();

    filtersSection.style.display = 'block';
    renderizarMarcas();

    renderMyPrinters();

    // Restaurar estado salvo (scroll e checkboxes) ao voltar da página de detalhe
    restaurarEstado();
}

function construirMapaTermos() {
    mapaTermos.clear();
    const termosSet = new Set();
    const items = [];

    cartuchos.forEach(item => {
        if (item.cartucho && !termosSet.has(item.cartucho)) {
            termosSet.add(item.cartucho);
            items.push({ termo: item.cartucho, tipo: 'cartucho', valor: item.cartucho });
            mapaTermos.set(item.cartucho, 'cartucho');
        }
        if (item.modelo && !termosSet.has(item.modelo)) {
            termosSet.add(item.modelo);
            items.push({ termo: item.modelo, tipo: 'modelo', valor: item.modelo });
            mapaTermos.set(item.modelo, 'modelo');
        }
    });

    searchItems = items;
}

function prepararFuse() {
    fuse = new Fuse(searchItems, {
        keys: ['termo'],
        threshold: 0.3,
        ignoreLocation: true,
        minMatchCharLength: 2
    });
}

function showAlert(message) {
    const alert = document.createElement('div');
    alert.className = 'upload-alert';
    alert.innerHTML = `
        <i class="fas fa-info-circle" style="color: var(--primary); margin-right: 0.5rem;"></i>
        ${message}
    `;
    document.body.appendChild(alert);
    setTimeout(() => alert.remove(), 5000);
}

function handleAutocomplete() {
    const termo = searchInput.value.trim();
    if (termo.length < 2 || !fuse) {
        autocompleteDropdown.style.display = 'none';
        return;
    }

    const results = fuse.search(termo);
    const suggestions = results.slice(0, 8);

    if (suggestions.length === 0) {
        autocompleteDropdown.style.display = 'none';
        return;
    }

    autocompleteDropdown.innerHTML = '';
    suggestions.forEach(result => {
        const item = result.item;
        const div = document.createElement('div');
        div.className = 'autocomplete-item';
        const iconClass = item.tipo === 'cartucho' ? 'fa-tint' : 'fa-print';
        div.innerHTML = `
            <i class="fas ${iconClass}"></i>
            <span>${item.termo}</span>
        `;
        div.addEventListener('click', () => {
            searchInput.value = item.valor;
            autocompleteDropdown.style.display = 'none';
            buscar(item.valor);
        });
        autocompleteDropdown.appendChild(div);
    });

    autocompleteDropdown.style.display = 'block';
}

document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !autocompleteDropdown.contains(e.target)) {
        autocompleteDropdown.style.display = 'none';
    }
});

searchInput.addEventListener('input', handleAutocomplete);

// Busca ampla
function buscaAmpla(termo) {
    if (!termo || cartuchos.length === 0) {
        resultsSection.style.display = 'none';
        impressorasContainer.style.display = 'none';
        welcomeMessage.style.display = 'block';
        return;
    }

    const termoLower = termo.toLowerCase();
    const termoLimpo = limparCodigoSKU(termoLower);

    const resultados = cartuchos.filter(item => {
        const modeloLimpo = limparCodigoSKU(item.modelo ? item.modelo.toLowerCase() : '');
        const cartuchoLimpo = limparCodigoSKU(item.cartucho ? item.cartucho.toLowerCase() : '');
        const modeloMatch = modeloLimpo.includes(termoLimpo);
        const cartuchoMatch = cartuchoLimpo.includes(termoLimpo);
        return modeloMatch || cartuchoMatch;
    });

    if (resultados.length === 0) {
        resultsSection.style.display = 'none';
        impressorasContainer.style.display = 'none';
        welcomeMessage.style.display = 'block';
        welcomeMessage.innerHTML = `
            <i class="fas fa-search" style="font-size: 4rem; color: var(--gray-300); margin-bottom: 1rem;"></i>
            <h3 style="color: var(--secondary);">Nenhum resultado para "${termo}"</h3>
            <p class="text-muted">Tente um termo diferente.</p>
        `;
        return;
    }

    cartuchosFiltrados = resultados;
    exibirImpressoras();
}

// Evento de tecla Enter e botão Buscar
searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        const termo = searchInput.value.trim();
        if (termo) {
            autocompleteDropdown.style.display = 'none';
            const tipo = mapaTermos.get(termo);
            if (tipo === 'cartucho') {
                buscar(termo);
            } else {
                buscaAmpla(termo);
            }
        }
    }
});

searchBtn.addEventListener('click', () => {
    const termo = searchInput.value.trim();
    if (termo) {
        autocompleteDropdown.style.display = 'none';
        const tipo = mapaTermos.get(termo);
        if (tipo === 'cartucho') {
            buscar(termo);
        } else {
            buscaAmpla(termo);
        }
    }
});

// Função de busca exata
function buscar(termo) {
    if (!termo || cartuchos.length === 0) {
        resultsSection.style.display = 'none';
        impressorasContainer.style.display = 'none';
        welcomeMessage.style.display = 'block';
        return;
    }

    let tipo = mapaTermos.get(termo);
    let resultados = [];

    if (tipo === 'cartucho') {
        const cartuchoEncontrado = cartuchos.find(c => c.cartucho === termo);
        if (cartuchoEncontrado) {
            const familia = cartuchoEncontrado.familia;
            const registrosFamilia = cartuchos.filter(c => c.familia === familia);
            const mapaCartuchos = new Map();
            registrosFamilia.forEach(reg => {
                const chave = reg.sku || reg.cartucho;
                if (!mapaCartuchos.has(chave)) {
                    mapaCartuchos.set(chave, {
                        cartucho: reg.cartucho,
                        marca: reg.marca,
                        tipo: reg.tipo,
                        sku: reg.sku,
                        status: reg.status,
                        familia: reg.familia,
                        modelos: new Set(),
                        cor: reg.cor,
                        preco: reg.preco,
                        parcela: reg.parcela,
                        paginas: reg.paginas
                    });
                }
                if (reg.modelo) {
                    mapaCartuchos.get(chave).modelos.add(reg.modelo);
                }
            });
            resultados = Array.from(mapaCartuchos.values()).map(item => ({
                ...item,
                modelos: Array.from(item.modelos).sort()
            }));
        }
    } else if (tipo === 'modelo') {
        const registrosModelo = cartuchos.filter(c => c.modelo === termo);
        const mapaCartuchos = new Map();
        registrosModelo.forEach(reg => {
            const chave = reg.sku || reg.cartucho;
            if (!mapaCartuchos.has(chave)) {
                mapaCartuchos.set(chave, {
                    cartucho: reg.cartucho,
                    marca: reg.marca,
                    tipo: reg.tipo,
                    sku: reg.sku,
                    status: reg.status,
                    familia: reg.familia,
                    modelos: new Set(),
                    cor: reg.cor,
                    preco: reg.preco,
                    parcela: reg.parcela,
                    paginas: reg.paginas
                });
            }
            if (reg.modelo) {
                mapaCartuchos.get(chave).modelos.add(reg.modelo);
            }
        });
        resultados = Array.from(mapaCartuchos.values()).map(item => ({
            ...item,
            modelos: Array.from(item.modelos).sort()
        }));
    } else {
        resultsSection.style.display = 'none';
        impressorasContainer.style.display = 'none';
        welcomeMessage.innerHTML = `
            <i class="fas fa-search" style="font-size: 4rem; color: var(--gray-300); margin-bottom: 1rem;"></i>
            <h3 style="color: var(--secondary);">Nenhum resultado para "${termo}"</h3>
            <p class="text-muted">Tente digitar um termo diferente ou selecione uma sugestão.</p>
        `;
        welcomeMessage.style.display = 'block';
        return;
    }

    if (resultados.length === 0) {
        resultsSection.style.display = 'none';
        impressorasContainer.style.display = 'none';
        welcomeMessage.innerHTML = `
            <i class="fas fa-box-open" style="font-size: 4rem; color: var(--gray-300); margin-bottom: 1rem;"></i>
            <h3 style="color: var(--secondary);">Nenhum produto encontrado</h3>
            <p class="text-muted">Não há cartuchos compatíveis para "${termo}".</p>
        `;
        welcomeMessage.style.display = 'block';
        return;
    }

    exibirResultadosBusca(resultados, termo, tipo);
}

function exibirResultadosBusca(resultados, termo, tipo) {
    resultsSection.style.display = 'block';
    impressorasContainer.style.display = 'none';
    welcomeMessage.style.display = 'none';
    resultsCount.textContent = `${resultados.length} cartucho(s)`;

    let html = '';

    if (tipo === 'cartucho') {
        const familia = resultados[0].familia;
        html += `
            <div class="family-card" id="family-${familia.replace(/[^a-zA-Z0-9]/g, '-')}">
                <div class="family-header">
                    <span>
                        <i class="fas fa-layer-group me-2" style="color: var(--primary);"></i>
                        Família: ${familia}
                        <small class="text-muted ms-2">(${resultados.length} cartuchos)</small>
                    </span>
                    <button class="btn btn-outline-primary btn-sm" onclick="verModelos('${familia}')">
                        <i class="fas fa-print me-1"></i> Ver impressoras compatíveis
                    </button>
                </div>
                <div class="product-list">
        `;
        resultados.forEach(item => {
            html += gerarLinhaProduto(item);
        });
        html += `</div></div>`;
    } else {
        const familias = [...new Set(resultados.map(r => r.familia))].sort();
        familias.forEach(fam => {
            const cartuchosDaFamilia = resultados.filter(r => r.familia === fam);
            html += `
                <div class="family-card" id="family-${fam.replace(/[^a-zA-Z0-9]/g, '-')}">
                    <div class="family-header">
                        <span>
                            <i class="fas fa-layer-group me-2" style="color: var(--primary);"></i>
                            Família: ${fam}
                            <small class="text-muted ms-2">(${cartuchosDaFamilia.length} cartuchos)</small>
                        </span>
                        <button class="btn btn-outline-primary btn-sm" onclick="verModelos('${fam}')">
                            <i class="fas fa-print me-1"></i> Ver impressoras compatíveis
                        </button>
                    </div>
                    <div class="product-list">
            `;
            cartuchosDaFamilia.forEach(item => {
                html += gerarLinhaProduto(item);
            });
            html += `</div></div>`;
        });
    }

    resultsContainer.innerHTML = html;

    // Adicionar botões de compra múltipla em cada family-card
    document.querySelectorAll('.family-card').forEach(card => {
        adicionarBotaoMultiEListeners(card);
    });
}

// Gera linha de produto com suporte a múltiplos badges de cor e checkbox
function gerarLinhaProduto(item) {
    const imagemUrl = `https://img.kalunga.com.br/fotosdeprodutos/${item.sku}.jpg`;
    const corInfo = mapearCor(item.cor);

    const precoFormatado = formatarPreco(item.preco);
    const parcelaFormatada = item.parcela ? formatarPreco(item.parcela) : null;
    const parcelamentoTexto = parcelaFormatada ? `3x de ${parcelaFormatada}` : 'à vista ou em até 10x';
    const paginasTexto = item.paginas ? ` · ${item.paginas} páginas` : ' · não informado';

    let quantOptions = '';
    for (let i = 1; i <= 49; i++) {
        quantOptions += `<option value="${i}">${i}</option>`;
    }

    let corBadges = '';
    if (corInfo.tipo === 'simples') {
        corBadges = `
            <span class="badge-color">
                <i class="fas ${corInfo.icone}" style="${corInfo.estilo}"></i> ${corInfo.cor}
            </span>
        `;
    } else if (corInfo.tipo === 'colorido') {
        corBadges = corInfo.cores.map(c => `
            <span class="badge-color">
                <i class="fas fa-tint" style="${c.estilo}"></i> ${c.cor}
            </span>
        `).join('');
    } else if (corInfo.tipo === 'combo') {
        corBadges = corInfo.cores.map(c => `
            <span class="badge-color">
                <i class="fas fa-tint" style="${c.estilo}"></i> ${c.cor}
            </span>
        `).join('');
    }

    return `
        <div class="product-row">
            <div class="product-checkbox">
                <input type="checkbox" class="cartucho-checkbox" data-sku="${item.sku}">
            </div>
            <div class="product-image">
                <img src="${imagemUrl}" alt="${item.cartucho}" onerror="this.src='https://via.placeholder.com/120x120?text=Sem+Imagem'">
            </div>
            <div class="product-info">
                <div class="product-details">
                    <div class="product-title">
                        ${item.cartucho}
                    </div>
                    <div class="product-sku">
                        Código: ${item.sku}
                        <span class="product-paginas">${paginasTexto}</span>
                    </div>
                    <div class="product-badges">
                        ${corBadges}
                        <span class="badge-color">
                            <i class="fas fa-tag"></i> ${item.marca}
                        </span>
                        <span class="badge-color">
                            <i class="fas fa-box"></i> ${item.tipo}
                        </span>
                    </div>
                </div>
                <div class="product-price-section">
                    <div class="price-row">
                        <div class="price-column">
                            <div class="price">${precoFormatado}</div>
                            <div class="price-small">${parcelamentoTexto}</div>
                        </div>
                        <div class="product-actions">
                            <select class="quantity-select" id="qty-${item.sku}">
                                ${quantOptions}
                            </select>
                            <a href="https://www.kalunga.com.br/adicionar_lista_produto_carrinho/${item.sku}" target="_blank" class="btn-add">
                                <i class="fas fa-cart-plus"></i> Comprar
                            </a>
                        </div>
                    </div>
                    <div class="shipping-info">
                        <i class="fas fa-truck"></i> Frete Grátis para Todo Brasil
                    </div>
                    <div class="shipping-info">
                        <i class="fas fa-store"></i> Retirada em 2 horas em Radial Mooca
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Função para adicionar botão de compra múltipla e listeners de checkbox
function adicionarBotaoMultiEListeners(container) {
    // Verifica se já existe um botão multi neste container
    if (container.querySelector('.comprar-multi')) return;

    // Cria o elemento do botão
    const divMulti = document.createElement('div');
    divMulti.className = 'comprar-multi';
    divMulti.innerHTML = `
        <a href="#" class="btn-comprar-multi" target="_blank">
            <i class="fas fa-cart-plus"></i> Comprar Cartuchos
        </a>
    `;
    container.appendChild(divMulti);

    const linkMulti = divMulti.querySelector('a');
    const checkboxes = container.querySelectorAll('.cartucho-checkbox');

    function atualizarBotaoMulti() {
        const selecionados = Array.from(checkboxes).filter(cb => cb.checked);
        if (selecionados.length > 1) {
            const skus = selecionados.map(cb => cb.dataset.sku).join('-');
            linkMulti.href = `https://www.kalunga.com.br/busca/1?q=${skus}`;
            divMulti.style.display = 'block';
        } else {
            divMulti.style.display = 'none';
        }
    }

    checkboxes.forEach(cb => {
        cb.addEventListener('change', atualizarBotaoMulti);
    });
}

// Função para exibir a lista de impressoras (após filtros ou busca ampla)
function exibirImpressoras() {
    const modelosMap = new Map();
    cartuchosFiltrados.forEach(item => {
        if (item.modelo && !modelosMap.has(item.modelo)) {
            modelosMap.set(item.modelo, {
                modelo: item.modelo,
                marca: item.marca,
                tipo: item.tipo,
                familias: new Set(),
                foto_impressora: item.foto_impressora
            });
        }
        if (item.modelo && item.familia) {
            const registro = modelosMap.get(item.modelo);
            if (registro) registro.familias.add(item.familia);
        }
    });

    const modelos = Array.from(modelosMap.values());

    if (modelos.length === 0) {
        impressorasContainer.style.display = 'none';
        resultsSection.style.display = 'none';
        welcomeMessage.style.display = 'block';
        welcomeMessage.innerHTML = `
            <i class="fas fa-print" style="font-size: 4rem; color: var(--gray-300); margin-bottom: 1rem;"></i>
            <h3 style="color: var(--secondary);">Nenhuma impressora encontrada</h3>
            <p class="text-muted">Tente outros filtros ou termo de busca.</p>
        `;
        return;
    }

    let html = '';
    const storedPrinters = getStoredPrinters().map(p => p.modelo);

    modelos.forEach(mod => {
        const familiasStr = Array.from(mod.familias).join(', ');
        const imagemUrl = mod.foto_impressora
            ? `https://img.kalunga.com.br/fotosdeprodutos/${mod.foto_impressora}.jpg`
            : `https://via.placeholder.com/80x80?text=${encodeURIComponent(mod.marca)}`;
        const idSublista = `sublista-${mod.modelo.replace(/[^a-zA-Z0-9]/g, '-')}`;
        const isAdded = storedPrinters.includes(mod.modelo);
        const btnClass = isAdded ? 'btn-add-printer added' : 'btn-add-printer';

        html += `
            <div class="impressora-card" data-modelo-card="${mod.modelo}">
                <div class="impressora-resumo" data-modelo="${mod.modelo}" data-target="${idSublista}">
                    <div class="impressora-imagem">
                        <img src="${imagemUrl}" alt="${mod.modelo}" onerror="this.src='https://img.freepik.com/vetores-premium/modelo-de-design-de-ilustracao-de-icone-de-vetor-de-impressora_598213-972.jpg'">
                    </div>
                    <div class="impressora-info">
                        <h4>${mod.modelo}</h4>
                        <p><i class="fas fa-tag"></i> ${mod.marca} | ${mod.tipo}</p>
                        <p><small><i class="fas fa-layer-group"></i> Famílias: ${familiasStr}</small></p>
                    </div>
                    <button class="toggle-cartuchos" data-modelo="${mod.modelo}" data-target="${idSublista}">
                        <i class="fas fa-chevron-down"></i> Ver cartuchos
                    </button>
                    <button class="btn-veja-mais" data-modelo="${mod.modelo}">
                        <i class="fas fa-info-circle"></i> Veja mais Informações
                    </button>
                    <button class="${btnClass}" title="${isAdded ? 'Já adicionada' : 'Adicionar às Minhas Impressoras'}" 
                            data-modelo="${mod.modelo}" 
                            data-marca="${mod.marca}" 
                            data-tipo="${mod.tipo}" 
                            data-foto="${mod.foto_impressora || ''}">
                        <i class="fas ${isAdded ? 'fa-check' : 'fa-plus'}"></i>
                    </button>
                </div>
                <div class="cartuchos-sublista" id="${idSublista}" style="display: none;"></div>
            </div>
        `;
    });

    impressorasContainer.innerHTML = html;
    impressorasContainer.style.display = 'block';
    resultsSection.style.display = 'none';
    welcomeMessage.style.display = 'none';

    if (modeloParaAbrir) {
        setTimeout(() => {
            const targetId = `sublista-${modeloParaAbrir.replace(/[^a-zA-Z0-9]/g, '-')}`;
            const sublista = document.getElementById(targetId);
            if (sublista && sublista.style.display === 'none') {
                const btn = document.querySelector(`.toggle-cartuchos[data-target="${targetId}"]`);
                if (btn) btn.click();
            }
            modeloParaAbrir = null;
        }, 100);
    }

    function fecharTodasSublistasExceto(atualId) {
        document.querySelectorAll('.cartuchos-sublista').forEach(s => {
            if (s.id !== atualId && s.style.display === 'block') {
                s.style.display = 'none';
                const btn = document.querySelector(`.toggle-cartuchos[data-target="${s.id}"]`);
                if (btn) btn.innerHTML = '<i class="fas fa-chevron-down"></i> Ver cartuchos';
            }
        });
    }

    document.querySelectorAll('.impressora-resumo').forEach(resumo => {
        resumo.addEventListener('click', function (e) {
            if (e.target.closest('.toggle-cartuchos') || e.target.closest('.btn-add-printer') || e.target.closest('.btn-veja-mais')) return;

            const modelo = this.dataset.modelo;
            const targetId = this.dataset.target;
            const sublista = document.getElementById(targetId);
            const botao = this.querySelector('.toggle-cartuchos');

            fecharTodasSublistasExceto(targetId);

            if (sublista.style.display === 'none') {
                const cartuchosDoModelo = cartuchosFiltrados.filter(c => c.modelo === modelo);
                let cartuchosHtml = '<div class="product-list">';
                cartuchosDoModelo.forEach(item => {
                    cartuchosHtml += gerarLinhaProduto(item);
                });
                cartuchosHtml += '</div>';
                sublista.innerHTML = cartuchosHtml;
                sublista.style.display = 'block';
                if (botao) botao.innerHTML = '<i class="fas fa-chevron-up"></i> Ocultar cartuchos';

                // Adicionar botão de compra múltipla nesta sublista
                adicionarBotaoMultiEListeners(sublista);
            } else {
                sublista.style.display = 'none';
                if (botao) botao.innerHTML = '<i class="fas fa-chevron-down"></i> Ver cartuchos';
            }
        });
    });

    document.querySelectorAll('.toggle-cartuchos').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            const modelo = this.dataset.modelo;
            const targetId = this.dataset.target;
            const sublista = document.getElementById(targetId);

            fecharTodasSublistasExceto(targetId);

            if (sublista.style.display === 'none') {
                const cartuchosDoModelo = cartuchosFiltrados.filter(c => c.modelo === modelo);
                let cartuchosHtml = '<div class="product-list">';
                cartuchosDoModelo.forEach(item => {
                    cartuchosHtml += gerarLinhaProduto(item);
                });
                cartuchosHtml += '</div>';
                sublista.innerHTML = cartuchosHtml;
                sublista.style.display = 'block';
                this.innerHTML = '<i class="fas fa-chevron-up"></i> Ocultar cartuchos';

                // Adicionar botão de compra múltipla nesta sublista
                adicionarBotaoMultiEListeners(sublista);
            } else {
                sublista.style.display = 'none';
                this.innerHTML = '<i class="fas fa-chevron-down"></i> Ver cartuchos';
            }
        });
    });

    // Event listeners para botões "Veja mais Informações"
    document.querySelectorAll('.btn-veja-mais').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            const modelo = this.dataset.modelo;
            // Salvar estado (opcional)
            sessionStorage.setItem('scrollPos', window.scrollY);
            // Redirecionar para a página da impressora na raiz
            window.location.href = `impressora.html?modelo=${encodeURIComponent(modelo)}`;
        });
    });
}

// Função para salvar estado antes de navegar para a página de detalhe
function salvarEstadoParaDetalhe() {
    sessionStorage.setItem('scrollPos', window.scrollY);
    const selecionados = Array.from(document.querySelectorAll('.cartucho-checkbox:checked')).map(cb => cb.dataset.sku);
    sessionStorage.setItem('selecionados', JSON.stringify(selecionados));
}

// Função para restaurar estado ao voltar da página de detalhe
function restaurarEstado() {
    const scrollPos = sessionStorage.getItem('scrollPos');
    if (scrollPos) {
        window.scrollTo(0, parseInt(scrollPos));
        sessionStorage.removeItem('scrollPos');
    }
    const selecionados = JSON.parse(sessionStorage.getItem('selecionados') || '[]');
    if (selecionados.length > 0) {
        // Aguarda um pouco para os elementos serem renderizados
        setTimeout(() => {
            selecionados.forEach(sku => {
                const cb = document.querySelector(`.cartucho-checkbox[data-sku="${sku}"]`);
                if (cb) cb.checked = true;
            });
            // Reativar botões multi em todos os containers
            document.querySelectorAll('.family-card, .cartuchos-sublista').forEach(container => {
                if (container.querySelector('.cartucho-checkbox')) {
                    adicionarBotaoMultiEListeners(container);
                }
            });
            sessionStorage.removeItem('selecionados');
        }, 500);
    }
}

window.verModelos = function (familia) {
    const modelosSet = new Set();
    cartuchos.forEach(c => {
        if (c.familia === familia && c.modelo) {
            modelosSet.add(c.modelo);
        }
    });
    const modelos = Array.from(modelosSet).sort();

    let listaHtml = '<ul class="list-group">';
    modelos.forEach(modelo => {
        const item = cartuchos.find(c => c.modelo === modelo);
        const imagemUrl = (item && item.foto_impressora)
            ? `https://img.kalunga.com.br/fotosdeprodutos/${item.foto_impressora}.jpg`
            : 'https://img.freepik.com/vetores-premium/modelo-de-design-de-ilustracao-de-icone-de-vetor-de-impressora_598213-972.jpg';
        listaHtml += `
            <li class="list-group-item">
                <div class="modal-impressora-img">
                    <img src="${imagemUrl}" alt="${modelo}" onerror="this.src='https://img.freepik.com/vetores-premium/modelo-de-design-de-ilustracao-de-icone-de-vetor-de-impressora_598213-972.jpg'">
                </div>
                <span>${modelo}</span>
            </li>
        `;
    });
    listaHtml += '</ul>';
    modalBody.innerHTML = listaHtml || '<p class="text-muted">Nenhum modelo encontrado para esta família.</p>';
    modelosModal.show();
};

// ==================== FUNÇÕES MINHAS IMPRESSORAS ====================
function getStoredPrinters() {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
}

function savePrinters(printers) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(printers));
}

function renderMyPrinters() {
    const printers = getStoredPrinters();
    myPrintersSection.style.display = 'block';

    if (printers.length === 0) {
        myPrintersContainer.style.display = 'none';
        myPrintersEmpty.style.display = 'block';
    } else {
        myPrintersContainer.style.display = 'grid';
        myPrintersEmpty.style.display = 'none';
        let html = '';
        printers.forEach(p => {
            const imagemUrl = p.foto_impressora
                ? `https://img.kalunga.com.br/fotosdeprodutos/${p.foto_impressora}.jpg`
                : 'https://via.placeholder.com/50x50?text=Printer';
            html += `
                <div class="my-printer-item" data-modelo="${p.modelo}">
                    <div class="my-printer-img">
                        <img src="${imagemUrl}" alt="${p.modelo}" onerror="this.src='https://via.placeholder.com/50x50?text=Printer'">
                    </div>
                    <div class="my-printer-info">
                        <span class="my-printer-model">${p.modelo}</span>
                        <span class="my-printer-marca">${p.marca}</span>
                    </div>
                    <div class="my-printer-actions">
                        <button class="btn-buy-cartridges" title="Ver cartuchos compatíveis" onclick="pesquisarImpressora('${p.modelo}')">
                            <i class="fas fa-shopping-cart"></i> Comprar
                        </button>
                        <button class="btn-remove-printer" title="Remover impressora">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
            `;
        });
        myPrintersContainer.innerHTML = html;

        myPrintersContainer.querySelectorAll('.btn-remove-printer').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const item = btn.closest('.my-printer-item');
                const modelo = item.dataset.modelo;
                removePrinter(modelo);
            });
        });
    }
}

function addPrinter(printer) {
    let printers = getStoredPrinters();
    if (!printers.some(p => p.modelo === printer.modelo)) {
        printers.push(printer);
        savePrinters(printers);
        renderMyPrinters();

        const btn = document.querySelector(`.btn-add-printer[data-modelo="${printer.modelo}"]`);
        if (btn) {
            btn.classList.add('added');
            btn.title = 'Já adicionada';
            btn.innerHTML = '<i class="fas fa-check"></i>';
        }
    }
}

function removePrinter(modelo) {
    let printers = getStoredPrinters();
    printers = printers.filter(p => p.modelo !== modelo);
    savePrinters(printers);
    renderMyPrinters();

    const btn = document.querySelector(`.btn-add-printer[data-modelo="${modelo}"]`);
    if (btn) {
        btn.classList.remove('added');
        btn.title = 'Adicionar às Minhas Impressoras';
        btn.innerHTML = '<i class="fas fa-plus"></i>';
    }
}

window.pesquisarImpressora = function (modelo) {
    // Rola a página para o topo suavemente
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Opcional: dá foco no campo de busca
    searchInput.focus();

    searchInput.value = modelo;
    modeloParaAbrir = modelo;
    const tipo = mapaTermos.get(modelo);
    if (tipo === 'cartucho') {
        buscar(modelo);
    } else {
        buscaAmpla(modelo);
    }
};
// ==================== FIM FUNÇÕES MINHAS IMPRESSORAS ====================

impressorasContainer.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-add-printer');
    if (btn) {
        e.preventDefault();
        if (btn.classList.contains('added')) return;
        const modelo = btn.dataset.modelo;
        const marca = btn.dataset.marca;
        const tipo = btn.dataset.tipo;
        const foto = btn.dataset.foto;
        addPrinter({ modelo, marca, tipo, foto_impressora: foto });
    }
});

fetch('https://img.kalunga.com.br/Hotsite/Compatibilidades_Agrupado.xlsx')
    .then(response => {
        if (!response.ok) throw new Error('Arquivo não encontrado');
        return response.arrayBuffer();
    })
    .then(data => {
        const workbook = XLSX.read(new Uint8Array(data), { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
        processarDados(rows);
        showAlert('Planilha carregada automaticamente do servidor!');
    })
    .catch(error => {
        console.log('Carregamento automático falhou. Verifique a URL ou tente mais tarde.', error);
        welcomeMessage.innerHTML = `
            <i class="fas fa-exclamation-triangle" style="font-size: 4rem; color: var(--gray-300); margin-bottom: 1rem;"></i>
            <h3 style="color: var(--secondary);">Não foi possível carregar a planilha</h3>
            <p class="text-muted">Tente novamente mais tarde ou entre em contato com o suporte.</p>
        `;
    });
// Funções auxiliares
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

function adicionarBotaoMultiEListeners(container) {
    if (container.querySelector('.comprar-multi')) return;

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

// ========== Carregar dados e exibir ==========
let cartuchos = [];

function carregarDados() {
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
        })
        .catch(error => {
            console.error('Erro ao carregar planilha:', error);
            document.getElementById('impressoraDetalhe').innerHTML = '<p class="text-danger">Erro ao carregar dados. Tente novamente mais tarde.</p>';
        });
}

function processarDados(rows) {
    if (rows.length === 0) return;

    const hasHeader = true;
    let startIndex = hasHeader ? 1 : 0;
    const inactiveKeywords = ['descontinuado', 'inativo', 'fora de linha', 'obsoleto', 'cancelado'];

    cartuchos = [];
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
                if (!isInactive) {
                    cartuchos.push(cartucho);
                }
            }
        }
    }

    exibirDetalhe();
}

function exibirDetalhe() {
    const urlParams = new URLSearchParams(window.location.search);
    const modeloParam = urlParams.get('modelo');
    if (!modeloParam) {
        document.getElementById('impressoraDetalhe').innerHTML = '<p class="text-danger">Modelo não informado.</p>';
        return;
    }

    const cartuchosDaImpressora = cartuchos.filter(c => c.modelo === modeloParam);
    if (cartuchosDaImpressora.length === 0) {
        document.getElementById('impressoraDetalhe').innerHTML = '<p class="text-warning">Nenhum cartucho encontrado para esta impressora.</p>';
        return;
    }

    const primeiro = cartuchosDaImpressora[0];
    const familias = [...new Set(cartuchosDaImpressora.map(c => c.familia))].join(', ');

    // Atualizar meta tags
    const titulo = `${primeiro.marca} ${primeiro.modelo}: Cartuchos compatíveis | Kalunga`;
    document.title = titulo;
    const descricao = `Encontre cartuchos originais para ${primeiro.marca} ${primeiro.modelo}: ${cartuchosDaImpressora.map(c => c.cartucho).join(', ')}. Compre online na Kalunga.`;
    document.querySelector('meta[name="description"]').setAttribute('content', descricao);

    // Renderizar cabeçalho da impressora
    const imagemUrl = primeiro.foto_impressora
        ? `https://img.kalunga.com.br/fotosdeprodutos/${primeiro.foto_impressora}.jpg`
        : 'https://img.freepik.com/vetores-premium/modelo-de-design-de-ilustracao-de-icone-de-vetor-de-impressora_598213-972.jpg';

    const detalheHtml = `
        <div style="display: flex; align-items: center; gap: 2rem; flex-wrap: wrap;">
            <div style="width: 150px; height: 150px; background: var(--light-bg); border-radius: var(--radius); padding: 1rem; border: 1px solid var(--gray-200);">
                <img src="${imagemUrl}" alt="${primeiro.modelo}" style="max-width: 100%; max-height: 100%; object-fit: contain;">
            </div>
            <div>
                <h1>${primeiro.modelo}</h1>
                <p><strong>Marca:</strong> ${primeiro.marca} | <strong>Tipo:</strong> ${primeiro.tipo} | <strong>Famílias:</strong> ${familias}</p>
            </div>
        </div>
    `;
    document.getElementById('impressoraDetalhe').innerHTML = detalheHtml;

    // Renderizar lista de cartuchos
    let cartuchosHtml = '<div class="product-list">';
    cartuchosDaImpressora.forEach(item => {
        cartuchosHtml += gerarLinhaProduto(item);
    });
    cartuchosHtml += '</div>';
    document.getElementById('cartuchosContainer').innerHTML = cartuchosHtml;

    // Adicionar botão de compra múltipla
    const container = document.getElementById('cartuchosContainer');
    adicionarBotaoMultiEListeners(container);

    // Atualizar rodapé SEO
    const seoFooter = document.getElementById('seoFooter');
    const seoTitle = document.getElementById('seoTitle');
    const seoDescription = document.getElementById('seoDescription');

    seoTitle.innerText = `Cartuchos originais para ${primeiro.marca} ${primeiro.modelo}`;
    seoDescription.innerText = `Garanta a melhor qualidade de impressão para sua ${primeiro.marca} ${primeiro.modelo} com cartuchos originais. 
        Encontre as famílias ${familias} e todos os modelos compatíveis. A Kalunga oferece os melhores preços e entrega rápida para todo o Brasil.`;
    seoFooter.style.display = 'block';
}

// Iniciar
carregarDados();
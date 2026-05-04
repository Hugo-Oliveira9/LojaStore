const http = require("http")
const fs = require("fs")
const path = require("path")

const port = 3000

function dataHoje() {
    const d = new Date()
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, "0")
    const dd = String(d.getDate() + 1).padStart(2, "0")
    return `${yyyy}-${mm}-${dd}`
}

function timestamp() {
    return new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo"})
}

function registrarLog(metodo, rota, status, extra = "") {
    const pasta = path.resolve(".../logs")
    const arquivo = path.join(pasta, `${dataHoje()}.txt`)

    if (!fs.existsSync(pasta)) {
        fs.mkdirSync(pasta, { recursive: true})
    }

    const linha = `[${timestamp()}] ${metodo.padEnd(4)} ${rota.padEnd(30)} → ${status}${extra ? " | " + extra : ""}\n]`

    fs.appendFile(arquivo, linha, (err) => {
        if (err) console.error("Erro ao gravar log:", err)
    })
}

const server = http.createServer((req, res) => {
    const metodo = req.method
    const url = req.url

    if (url === "/estoque") {
        const estoqueFile = path.resolve("../data/estoque.json")
        fs.readFile(estoqueFile, (err, data) => {
            if (err) {
                registrarLog(metodo, url, 500, "estoque.json não encontrado")
                res.writeHead(500, { "Content-Type": "application/json" })
                res.end(JSON.stringify({ erro: "Arquivo de estoque não encontrado." }))
                return
            }
            registrarLog(metodo, url, 200)
            res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" })
            res.end(data)
        })
        return
    }

    if (url === "/config") {
        const configFile = path.resolve("../data/config.json")
        fs.readFile(configFile, (err, data) => {
            if (err) {
                registrarLog(metodo, url, 500, "config.json não encontrado")
                res.writeHead(500, { "Content-Type": "application/json" })
                res.end(JSON.stringify({ erro: "Arquivo de configuração não encontrado."}))
                return
            }
            registrarLog(metodo, url, 200)
            res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" })
            res.end(data)
        })
        return
    }

    if (url === "/adm") {
        const admFile = path.resolve("../adm/adm.html")
        fs.readFile(admFile, (err, data) => {
            if (err) {
                registrarLog(metodo, url, 500, "adm.html não encontrado")
                res.writeHead(500, { "Content-Type": "text/html" })
                res.end("<h1>Erro: painel ADM não encontrado.</h1>")
                return
            }
            registrarLog(metodo, url, 200)
            res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" })
            res.end(data)
        })
        return
    }

    if (url === "/log") {
        const pasta   = path.resolve("../logs")
        const arquivo = path.join(pasta, `${dataHoje()}.txt`)

        if (!fs.existsSync(pasta)) {
            fs.mkdirSync(pasta, { recursive: true })
        }

        const novaLinha = `[${timestamp()}] GET  /log                           → 200 | relatório gerado/atualizado\n`

        // Só lê o arquivo DEPOIS que o append terminar (callback)
        fs.appendFile(arquivo, novaLinha, (errAppend) => {
            if (errAppend) {
                res.writeHead(500, { "Content-Type": "text/plain" })
                res.end("Erro ao gravar log.")
                return
            }

            fs.readFile(arquivo, "utf-8", (errRead, data) => {
                if (errRead) {
                    res.writeHead(500, { "Content-Type": "text/plain" })
                    res.end("Erro ao ler log.")
                    return
                }

                const totalLinhas = data.split("\n").filter(Boolean).length
                const cabecalho   =
                    `========================================\n` +
                    ` Relatório de Log — ${dataHoje()}\n` +
                    ` Gerado em: ${timestamp()}\n` +
                    ` Total de registros: ${totalLinhas}\n` +
                    `========================================\n\n`

                res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" })
                res.end(cabecalho + data)
            })
        })
        return
    }

    let filePath = ""

    if (req.url === "/") {
        filePath = "../index.html"
    }
    else if (req.url === "/quemsou") {
        filePath = "../quemsou/quemsou.html"
    }
    else if (req.url === "/produtos") {
        filePath = "../produtos/produtos.html"
    }
    else if (req.url === "/produtos/prod1") {
        filePath = "../produtos/prod1/prod1.html";
    } 
    else if (req.url === "/produtos/prod2") {
        filePath = "../produtos/prod2/prod2.html";
    } 
    else if (req.url === "/produtos/prod3") {
        filePath = "../produtos/prod3/prod3.html";
    }
    else if (req.url === "/perguntas/perguntas.html") {
        filePath = "../perguntas/perguntas.html"
    }
    else if (req.url === "/assets/style.css") {
        filePath = "../assets/style.css"
    }  
    else {
        const errFile = path.resolve("../error/404.html")
        fs.readFile(errFile, (err, data) => {
            registrarLog(metodo, url, 404)
            if (err) {
                res.writeHead(500, { "Content-Type": "text/html" })
                res.end("<h1>Erro no servidor</h1>")
                return
            }
            res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" })
            res.end(data)
        });
        return;
    }

    //Ler arquivo
    fs.readFile(path.resolve(filePath), (err, data) => {
        if (err) {
            registrarLog(metodo, url, 500, err.message)
            res.writeHead(500)
            res.end("Erro no servidor")
            return
        }

        const ext = path.extname(filePath)
        const contentType = ext === ".css" ? "text/css" : "text.html"
        registrarLog(metodo, url, 200)
        res.writeHead(200, { "Content-Type": contentType });
        res.end(data);
    })
})

server.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`)
})
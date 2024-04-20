import express from 'express'
import basicAuth from 'express-basic-auth'
import http from 'node:http'
import { createBareServer } from '@tomphttp/bare-server-node'
import path from 'node:path'
import cors from 'cors'
import c from './c.js'

const __dirname = process.cwd()
const server = http.createServer()
const app = express(server)
const bareServer = createBareServer('/o/')
const PORT = process.env.PORT || 8080

if (c.challenge) {
  console.log('Password protection is enabled. Usernames are: ' + Object.keys(c.users))
  console.log('Passwords are: ' + Object.values(c.users))

  app.use(
    basicAuth({
      users: c.users,
      challenge: true,
    })
  )
}

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cors())
app.use(express.static(path.join(__dirname, 'public')))

if (c.routes !== false) {
  const routes = [
    { path: '/chemistry', file: 'a.html' },
    { path: '/trig', file: 'g.html' },
    { path: '/quadratics', file: 's.html' },
    { path: '/', file: 'index.html' },
    { path: '/devices', file: 'p.html' },
  ]

  routes.forEach((route) => {
    app.get(route.path, (req, res) => {
      res.sendFile(path.join(__dirname, 'static', route.file))
    })
  })
}

if (c.local !== false) {
  app.get('/e/*', (req, res, next) => {
    const baseUrls = [
      'https://raw.githubusercontent.com/v-5x/x/fixy',
      'https://raw.githubusercontent.com/ypxa/y/main',
      'https://raw.githubusercontent.com/ypxa/w/master',
    ]
    fetchData(req, res, next, baseUrls)
  })
}

const fetchData = async (req, res, next, baseUrls) => {
  try {
    const reqTarget = baseUrls.map((baseUrl) => `${baseUrl}/${req.params[0]}`)
    let data
    let asset

    for (const target of reqTarget) {
      asset = await fetch(target)
      if (asset.ok) {
        data = await asset.arrayBuffer()
        break
      }
    }

    if (data) {
      res.end(Buffer.from(data))
    } else {
      res.status(404).send()
    }
  } catch (error) {
    console.error(`Error fetching ${req.url}:`, error)
    res.status(500).send()
  }
}

app.get('*', (req, res) => {
  res.status(404).send();
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send();
});

server.on('request', (req, res) => {
  if (bareServer.shouldRoute(req)) {
    bareServer.routeRequest(req, res)
  } else {
    app(req, res)
  }
})

server.on('upgrade', (req, socket, head) => {
  if (bareServer.shouldRoute(req)) {
    bareServer.routeUpgrade(req, socket, head)
  } else {
    socket.end()
  }
})

server.on('listening', () => {
  console.log(`Running at http://localhost:${PORT}`)
})

server.listen({
  port: PORT,
})
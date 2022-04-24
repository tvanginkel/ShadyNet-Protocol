
console.log(Math.ceil(30 / 14))

let string = "{Hello:wow}"

let json = { id: 1, payload: { msg: string } }

let strJSON = JSON.stringify(json)

console.log(JSON.parse(strJSON));
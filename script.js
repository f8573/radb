const tables = {
    Employees: [
        {id: 1, name: "Alice", dept: "HR", age: 30},
        {id: 2, name: "Bob", dept: "Engineering", age: 25},
        {id: 3, name: "Charlie", dept: "Engineering", age: 35}
    ],
    Departments: [
        {dept: "HR", manager: "Sarah"},
        {dept: "Engineering", manager: "Alice"}
    ]
};

function deepCopy(rows) {
    return rows.map(r => ({...r}));
}

function project(rows, columns) {
    return rows.map(row => {
        let obj = {};
        columns.forEach(c => obj[c] = row[c]);
        return obj;
    });
}

function select(rows, condition) {
    const [col, op, valueRaw] = condition.match(/([^<>=!]+)([<>=!]+)(.+)/).slice(1);
    let value = valueRaw.trim();
    if (/^\d+$/.test(value)) value = Number(value);
    else value = value.replace(/^['"]|['"]$/g, '');
    return rows.filter(row => {
        const x = row[col.trim()];
        switch(op) {
            case '=': return x == value;
            case '!=': return x != value;
            case '>': return x > value;
            case '<': return x < value;
            case '>=': return x >= value;
            case '<=': return x <= value;
            default: return false;
        }
    });
}

function union(a, b) {
    const seen = new Set();
    const serialize = row => JSON.stringify(row);
    const result = [];
    a.concat(b).forEach(r => {
        const s = serialize(r);
        if (!seen.has(s)) { result.push(r); seen.add(s); }
    });
    return result;
}

function difference(a, b) {
    const setB = new Set(b.map(r => JSON.stringify(r)));
    return a.filter(r => !setB.has(JSON.stringify(r)));
}

function product(a, b) {
    const result = [];
    a.forEach(ar => {
        b.forEach(br => {
            result.push({...ar, ...br});
        });
    });
    return result;
}

function join(a, b) {
    const colsA = Object.keys(a[0] || {});
    const colsB = Object.keys(b[0] || {});
    const common = colsA.filter(c => colsB.includes(c));
    const result = [];
    a.forEach(ar => {
        b.forEach(br => {
            let ok = true;
            common.forEach(c => { if (ar[c] !== br[c]) ok = false; });
            if (ok) result.push({...ar, ...br});
        });
    });
    return result;
}

function parseExpression(str) {
    str = str.trim();
    if (!str) return [];
    const splitted = splitTop(str, '∪');
    if (splitted) return union(parseExpression(splitted[0]), parseExpression(splitted[1]));
    const diff = splitTop(str, '-');
    if (diff) return difference(parseExpression(diff[0]), parseExpression(diff[1]));
    const joinSplit = splitTop(str, '⋈');
    if (joinSplit) return join(parseExpression(joinSplit[0]), parseExpression(joinSplit[1]));
    const prod = splitTop(str, '×');
    if (prod) return product(parseExpression(prod[0]), parseExpression(prod[1]));

    let m;
    if (m = str.match(/^π_\{([^}]*)\}\((.*)\)$/)) {
        const cols = m[1].split(',').map(c => c.trim());
        return project(parseExpression(m[2]), cols);
    }
    if (m = str.match(/^σ_\{([^}]*)\}\((.*)\)$/)) {
        const cond = m[1];
        return select(parseExpression(m[2]), cond);
    }
    if (m = str.match(/^ρ_\{([^}]*)\}\((.*)\)$/)) {
        const name = m[1].trim();
        // rename just labels the table; evaluation unaffected
        const rows = parseExpression(m[2]);
        rows.name = name;
        return rows;
    }
    if (m = str.match(/^\((.*)\)$/)) {
        return parseExpression(m[1]);
    }
    // relation name
    if (tables[str]) return deepCopy(tables[str]);
    throw new Error('Unknown expression: ' + str);
}

function splitTop(str, symbol) {
    let depth = 0;
    for (let i = 0; i < str.length; i++) {
        const c = str[i];
        if (c === '(') depth++;
        else if (c === ')') depth--;
        else if (depth === 0 && str.startsWith(symbol, i)) {
            return [str.slice(0, i), str.slice(i + symbol.length)];
        }
    }
    return null;
}

function render(rows) {
    if (!rows.length) return '(empty)';
    const cols = Object.keys(rows[0]);
    let html = '<table><thead><tr>' + cols.map(c => `<th>${c}</th>`).join('') + '</tr></thead><tbody>';
    rows.forEach(r => {
        html += '<tr>' + cols.map(c => `<td>${r[c]}</td>`).join('') + '</tr>';
    });
    html += '</tbody></table>';
    return html;
}

if (typeof document !== 'undefined') {
    document.getElementById('run').addEventListener('click', () => {
        const expr = document.getElementById('expr').value;
        try {
            const result = parseExpression(expr);
            document.getElementById('output').innerHTML = render(result);
        } catch (e) {
            document.getElementById('output').textContent = e.message;
        }
    });
}

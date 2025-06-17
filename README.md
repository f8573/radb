# Relational Algebra Mathpad

This project provides a simple frontend mathpad for experimenting with relational algebra expressions. Open `index.html` in your browser and enter an expression using relational algebra notation.

## Example expressions

```
π_{name}(Employees)
σ_{age>30}(Employees)
Employees ⋈ Departments
π_{name}(σ_{age>25}(Employees))
```

The page evaluates the expression against built in sample tables and displays the resulting relation.

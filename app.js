const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const isValid = require('date-fns/isValid')
const format = require('date-fns/format')
//const isMatch = require('date-fns/isMatch')
const toDate = require('date-fns/toDate')
const app = express()

app.use(express.json())
const dbPath = path.join(__dirname, 'todoApplication.db')

let db = null
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3001, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}
initializeDBAndServer()

const checkRequestsQueries = async (request, response, next) => {
  const {search_q, category, priority, status, date} = request.query
  const {todoId} = request.params
  if (category !== undefined) {
    const categoryArray = ['WORK', 'HOME', 'LEARNING']
    const categoryIsInArray = categoryArray.includes(category)
    if (categoryIsInArray === true) {
      request.category = category
    } else {
      response.status(400)
      response.send('Invalid Todo Category')
      return
    }
  }

  if (priority !== undefined) {
    const priorityArray = ['HIGH', 'MEDIUM', 'LOW']
    const priorityIsInArray = priorityArray.includes(priority)
    if (priorityIsInArray == true) {
      request.priority = priority
    } else {
      response.status(400)
      response.send('Invalid Todo Priority')
      return
    }
  }

  if (status !== undefined) {
    const statusArray = ['TO DO', 'IN PROGRESS', 'DONE']
    const statusIsInArray = statusArray.includes(status)
    if (statusIsInArray === true) {
      request.status = status
    } else {
      response.status(400)
      response.send('Invalid Todo Status')
      return
    }
  }

  if (date !== undefined) {
    try {
      const myDate = new Date(date)
      const formatedDate = format(new Date(date), 'yyyy-MM-dd')
      console.log(formatedDate, 'f')
      const result = toDate(
        new Date(
          `${myDate.getFullYear()}-${
            myDate.getMonth() + 1
          }-${myDate.getDate()}`,
        ),
      )
      console.log(result, 'r')
      console.log(new Date(), 'new')

      const isValidDate = await isValid(result)
      console.log(isValidDate, 'V')

      if (isValidDate === true) {
        request.date = formatedDate
      } else {
        response.status(400)
        response.send('Invalid Due Date')
      }
    } catch (e) {
      response.status(400)
      response.send('Invalid Due Date')
      return
    }
  }
  request.todoId = todoId
  request.search_q = search_q
  next()
}

const checkRequestsBody = async (request, response, next) => {
  const {id, todo, category, priority, status, dueDate} = request.body
  const {todoId} = request.params

  if (category !== undefined) {
    categoryArray = ['WORK', 'HOME', 'LEARNING']
    categoryIsInArray = categoryArray.includes(category)
    if (categoryIsInArray === true) {
      request.category = category
    } else {
      response.status(400)
      response.send('Invalid Todo Category')
      return
    }
  }

  if (priority !== undefined) {
    priorityArray = ['HIGH', 'MEDIUM', 'LOW']
    priorityIsInArray = priorityArray.includes(priority)
    if (priorityIsInArray == true) {
      request.priority = priority
    } else {
      response.status(400)
      response.send('Invalid Todo Priority')
      return
    }
  }

  if (status !== undefined) {
    statusArray = ['TO DO', 'IN PROGRESS', 'DONE']
    statusIsInArray = statusArray.includes(status)
    if (statusIsInArray === true) {
      request.status = status
    } else {
      response.status(400)
      response.send('Invalid Todo Status')
      return
    }
  }

  if (dueDate !== undefined) {
    try {
      const formatedDate = format(new Date(dueDate), 'yyyy-MM-dd')
      console.log(formatedDate)
      const result = toDate(new Date(formatedDate))

      const isValidDate = isValid(result)
      console.log(isValidDate)
      console.log(isValidDate)

      if (isValidDate === true) {
        request.dueDate = formatedDate
      } else {
        response.status(400)
        response.send('Invalid Due Date')
      }
    } catch (e) {
      response.status(400)
      response.send('Invalid Due Date')
      return
    }
  }
  request.todoId = todoId
  request.todo = todo
  request.id = id
  next()
}

//API-1 GET Todos

app.get('/todos/', checkRequestsQueries, async (request, response) => {
  const {status = '', search_q = '', priority = '', category = ''} = request

  console.log(status, search_q, priority, category)
  const getTodosQuery = `
  
  SELECT id, todo, priority, category, status, due_date AS dueDate FROM todo
  WHERE todo LIKE '%${search_q}%' AND priority LIKE '%${priority}%' AND status LIKE '%${status}%'
  AND category LIKE '%${category}%';
  `
  const todosArray = await db.all(getTodosQuery)
  response.send(todosArray)
})

//API-2 GET Todo

app.get('/todos/:todoId/', checkRequestsQueries, async (request, response) => {
  const {todoId} = request
  const getTodoQuery = `
  SELECT id, todo, priority, status, category, due_date AS dueDate FROM todo
  WHERE id = ${todoId};
  `
  const todo = await db.get(getTodoQuery)
  response.send(todo)
})

//API -3 GET Agenda

// app.get('/agenda/', checkRequestsQueries, async (request, response) => {
//   const {date} = request
//   console.log(date, 'a')

//   const selectDueDateQuery = `
//   SELECT id, todo, category, priority, status, due_date AS dueDate FROM todo WHERE due_date = '${date}'

//   `
//   const todoArray = await db.all(selectDueDateQuery)

//   if (todoArray === undefined) {
//     response.status(400)
//     response.send('Invalid Due Date')
//   } else {
//     response.send(todoArray)
//   }
// })

// API -3 GET Agenda
app.get('/agenda/', checkRequestsQueries, async (request, response) => {
  const { date } = request;  // Expecting date in 'yyyy-MM-dd' format from the middleware
  
  if (date === undefined) {
    response.status(400);
    response.send('Invalid Due Date');
    return;
  }

  try {
    const selectDueDateQuery = `
      SELECT id, todo, category, priority, status, due_date AS dueDate 
      FROM todo 
      WHERE due_date = '${date}';
    `;
    const todoArray = await db.all(selectDueDateQuery);

    if (todoArray.length === 0) {
      response.status(404);
      response.send('No Todos found for the given due date');
    } else {
      response.send(todoArray);
    }
  } catch (e) {
    console.error(e.message);
    response.status(500);
    response.send('Server Error');
  }
});

//API -4 POST todo

app.post('/todos/', checkRequestsBody, async (request, response) => {
  const {id, todo, category, priority, status, dueDate} = request
  const addTodoQuery = `
  INSERT INTO todo(id, todo, category, priority, status, due_date)
  VALUES(${id}, '${todo}', '${category}', '${priority}', '${status}', '${dueDate}');

  `
  const createUser = await db.run(addTodoQuery)
  console.log(createUser)
  response.send({ message: "Todo Successfully Added", todoDetails: { id, todo, priority, status, category, dueDate } });
})

//API -5 Update Todo

app.put('/todos/:todoId/', checkRequestsBody, async (request, response) => {
  const {todoId} = request
  const {todo, category, priority, status, dueDate} = request
  let updateTodoQuery = null
  console.log(todo, category, priority, status, dueDate)

  switch (true) {
    case status !== undefined:
      updateTodoQuery = `UPDATE todo SET status = '${status}' WHERE id = ${todoId}`
      await db.run(updateTodoQuery)
      response.send('Status Updated')
      break

    case priority !== undefined:
      updateTodoQuery = `UPDATE todo SET priority = '${priority}' WHERE id = ${todoId}`
      await db.run(updateTodoQuery)
      response.send('Priority Updated')
      break

    case todo !== undefined:
      updateTodoQuery = `UPDATE todo SET todo = '${todo}' WHERE id = ${todoId}`
      await db.run(updateTodoQuery)
      response.send('Todo Updated')
      break

    case category !== undefined:
      updateTodoQuery = `UPDATE todo SET category = '${category}' WHERE id = ${todoId}`
      await db.run(updateTodoQuery)
      response.send('Category Updated')
      break

    case dueDate !== undefined:
      updateTodoQuery = `UPDATE todo SET due_date = '${dueDate}' WHERE id = ${todoId}`
      await db.run(updateTodoQuery)
      response.send('Due Date Updated')
      break
  }
})

//API -6 Delete Todo

app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const deleteTodoQuery = `
  DELETE FROM todo WHERE id = ${todoId}
  `
  await db.run(deleteTodoQuery)
  response.send({measage:'Todo Deleted',todoId : todoId})
})
module.exports = app

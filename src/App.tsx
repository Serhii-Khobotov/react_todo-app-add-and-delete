/* eslint-disable max-len */
/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { useEffect, useState } from 'react';

import * as todoService from './api/todos';
import { UserWarning } from './components/UserWarning';
import { TodoHeader } from './components/TodoHeader';
import { TodoList } from './components/TodoList';
import { TodoFooter } from './components/TodoFooter';
import { TodoNotification } from './components/TodoNotification';
import { Todo } from './types/Todo';
import { Loader } from './components/Loader/Loader';

export const App: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterField, setFilterField] = useState('all');
  const [errorMessage, setErrorMessage] = useState('');
  const [tempTodo, setTempTodo] = useState<Todo | null>(null);

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(''), 3000);

      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  useEffect(() => {
    loadTodos();
  }, [todoService.USER_ID]);

  function loadTodos() {
    setErrorMessage('');
    setLoading(true);

    todoService
      .getTodos()
      .then(setTodos)
      .catch(() => setErrorMessage('Unable to load todos'))
      .finally(() => setLoading(false));
  }

  const addTodo = ({ title, completed, userId }: Todo) => {
    setErrorMessage('');
    setLoading(true);

    const newTodo = {
      id: Math.random(),
      title: title.trim(),
      userId: todoService.USER_ID,
      completed: false,
    }

    setTempTodo(newTodo);

    return todoService.createTodo({ title, completed, userId })
      .then(newTodo => {
        setTodos(currentTodos => [...currentTodos, newTodo]);
      })
      .catch((error) => {
        setErrorMessage('Unable to add a todo');
        throw error;
      })
      .finally(() => {
        setLoading(false);

        setTempTodo(null);
      });

  }

  const deleteTodo = async(todoId: number) => {
    setErrorMessage('');
    setLoading(true);
    setTodos(currentTodos => currentTodos.map(todo =>
      todo.id === todoId ? { ...todo, isDeleting: true} : todo
    ))
    
    try {
      await todoService.deleteTodo(todoId);
      setTodos(currentTodos => currentTodos.filter(todo => todo.id !== todoId));
    } catch(error) {
      setErrorMessage('Unable to delete a todo');
      setTodos(currentTodos => currentTodos.map(todo =>
        todo.id === todoId ? { ...todo, isDeleting: false} : todo
      ))
      throw error;
    } 
    finally {
      setLoading(false);
    };
}

  const clearCompletedTodos = async () => {
    setLoading(true);
    const completedTodos = todos.filter(todo => todo.completed);

    try {
      await Promise.all(completedTodos.map(todo => todoService.deleteTodo(todo.id)));
      setTodos(prevTodos => prevTodos.filter(todo => !todo.completed));
    } catch {
      setErrorMessage('Unable to delete a todo');
    } finally {
      setLoading(false);
    }
  };

  const filterTodos = (value: string) => {
    switch (value) {
      case 'active':
        return [...todos].filter(todo => !todo.completed);
      case 'completed':
        return [...todos].filter(todo => todo.completed);
    }

    return todos;
  };

  if (!todoService.USER_ID) {
    return <UserWarning />;
  }

  return (
    <div className="todoapp">
      <h1 className="todoapp__title">todos</h1>

      <div className="todoapp__content">
        <TodoHeader
          todos={todos}
          onSubmit={addTodo}
          // errorMessage={errorMessage}
          validation={setErrorMessage}
          isLoading={loading}

        />

        {todos.length > 0 &&
        <TodoList
          todos={filterTodos(filterField)}
          onDelete={deleteTodo}
          tempTodo={tempTodo}
          isLoading={loading}
        />}

        {/* Hide the footer if there are no todos */}

        {todos.length > 0 && (
          <TodoFooter
            todos={todos}
            filterField={filterField}
            filterBy={setFilterField}
            clearCompleted={clearCompletedTodos}
          />
        )}
      </div>

      <TodoNotification errorText={errorMessage} />

      {/* {loading && <Loader />} */}
    </div>
  );
};

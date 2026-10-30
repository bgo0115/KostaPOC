import { useCallback, useEffect, useState } from 'react'
import './App.css'

async function request(path, options) {
  const res = await fetch(path, options)
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    throw new Error(data?.error ?? `요청에 실패했습니다 (${res.status})`)
  }
  return data
}

function dueDate(book) {
  const d = new Date(`${book.borrowed_at}T00:00:00`)
  d.setDate(d.getDate() + book.loan_days)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function App() {
  const [books, setBooks] = useState([])
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      setBooks(await request('/api/books'))
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function act(book, action) {
    setError('')
    try {
      const options = { method: 'POST' }
      if (action === 'rent') {
        options.headers = { 'Content-Type': 'application/json' }
        options.body = JSON.stringify({ name })
      }
      await request(`/api/books/${book.id}/${action}`, options)
    } catch (e) {
      setError(e.message)
    }
    await load()
  }

  return (
    <main className="app">
      <h1>사내 도서 대여</h1>

      <label className="name-field">
        이름
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="대여할 사람 이름"
        />
      </label>

      <div className="error" role="alert">
        {error}
      </div>

      {loading ? (
        <p>불러오는 중...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>제목</th>
              <th>저자</th>
              <th>상태</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {books.map((book) => (
              <tr key={book.id}>
                <td>{book.title}</td>
                <td>{book.author}</td>
                <td>
                  {book.borrower
                    ? `대여 중 (${book.borrower}, 반납 예정 ${dueDate(book)})`
                    : '대여 가능'}
                </td>
                <td>
                  <button onClick={() => act(book, 'rent')}>대여</button>{' '}
                  <button onClick={() => act(book, 'return')}>반납</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  )
}

export default App

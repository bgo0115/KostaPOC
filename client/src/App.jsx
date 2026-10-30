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
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  // 같은 메시지가 반복돼도 3초 타이머가 다시 시작되도록 id 를 붙인다
  const showError = useCallback((message) => {
    setError({ id: Date.now(), message })
  }, [])

  useEffect(() => {
    if (!error) return
    const timer = setTimeout(() => setError(null), 3000)
    return () => clearTimeout(timer)
  }, [error])

  const load = useCallback(async () => {
    try {
      setBooks(await request('/api/books'))
    } catch (e) {
      showError(e.message)
    } finally {
      setLoading(false)
    }
  }, [showError])

  useEffect(() => {
    load()
  }, [load])

  async function act(book, action) {
    setError(null)
    try {
      const options = { method: 'POST' }
      if (action === 'rent') {
        options.headers = { 'Content-Type': 'application/json' }
        options.body = JSON.stringify({ name: name.trim() })
      }
      await request(`/api/books/${book.id}/${action}`, options)
    } catch (e) {
      showError(e.message)
    }
    await load()
  }

  const canRent = name.trim() !== ''

  return (
    <main className="app">
      {error && (
        <div className="error-banner" role="alert">
          {error.message}
        </div>
      )}

      <h1>사내 도서 대여</h1>

      <label className="name-field">
        이름
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="대여할 사람 이름"
        />
        {!canRent && <span className="hint">이름을 입력해야 대여할 수 있습니다</span>}
      </label>

      {loading ? (
        <p>불러오는 중...</p>
      ) : books.length === 0 ? (
        <p className="empty">등록된 책이 없습니다.</p>
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
                  {book.borrower ? (
                    <span className="badge badge-rented">
                      {`대여 중 (${book.borrower}, 반납 예정 ${dueDate(book)})`}
                    </span>
                  ) : (
                    <span className="badge badge-available">대여 가능</span>
                  )}
                </td>
                <td>
                  <button onClick={() => act(book, 'rent')} disabled={!canRent}>
                    대여
                  </button>{' '}
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

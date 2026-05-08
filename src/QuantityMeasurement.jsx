import { useState } from 'react';
import './QuantityMeasurement.scss';

const BASE_URL = 'http://localhost:8085/api/quantities';

const TABS = ['Add', 'Subtract', 'Divide', 'Compare', 'Convert', 'History'];

const UNITS_BY_TYPE = {
  length: ['m', 'cm', 'km'],
  weight: ['kg', 'g'],
  temperature: ['C', 'F'],
  volume: ['L', 'mL'],
};

function QuantityMeasurement() {
  const [activeTab, setActiveTab] = useState('Add');

  const [value1, setValue1] = useState('');
  const [value2, setValue2] = useState('');
  const [type, setType] = useState('length');
  const [unit, setUnit] = useState('m');

  const [compareType, setCompareType] = useState('length');
  const [compareUnit1, setCompareUnit1] = useState('m');
  const [compareUnit2, setCompareUnit2] = useState('km');

  const [convertValue, setConvertValue] = useState('');
  const [convertType, setConvertType] = useState('length');
  const [fromUnit, setFromUnit] = useState('m');
  const [toUnit, setToUnit] = useState('cm');

  const [historyAction, setHistoryAction] = useState('ADD');
  const [historyResults, setHistoryResults] = useState([]);

  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function getUnits(t) {
    return UNITS_BY_TYPE[t] || ['unit'];
  }

  function handleTypeChange(newType) {
    setType(newType);
    setUnit(getUnits(newType)[0]);
  }

  function buildArithmeticBody() {
    return {
      thisQuantity: { type, value: parseFloat(value1), symbol: unit, label: 'Value 1' },
      thatQuantity: { type, value: parseFloat(value2), symbol: unit, label: 'Value 2' },
      targetQuantity: { type, value: 0, symbol: unit, label: 'Target' },
    };
  }

  function buildCompareBody() {
    return {
      thisQuantity: { type: compareType, value: parseFloat(value1), symbol: compareUnit1, label: 'Value 1' },
      thatQuantity: { type: compareType, value: parseFloat(value2), symbol: compareUnit2, label: 'Value 2' },
      targetQuantity: { type: compareType, value: 0, symbol: compareUnit1, label: 'Target' },
    };
  }

  function callApi(endpoint, body) {
    setLoading(true);
    setError('');
    setResult(null);

    fetch(`${BASE_URL}/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
      .then((res) => {
        if (!res.ok) {
          return res.text().then((text) => {
            let msg = 'Request failed';
            try {
              const json = JSON.parse(text);
              msg = json.message || JSON.stringify(json);
            } catch (_) {
              msg = text || msg;
            }
            throw new Error(msg);
          });
        }
        return res.json();
      })
      .then((data) => {
        setResult(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }

  function handleAdd() { callApi('add', buildArithmeticBody()); }
  function handleSubtract() { callApi('subtract', buildArithmeticBody()); }
  function handleDivide() { callApi('divide', buildArithmeticBody()); }
  function handleCompare() { callApi('compare', buildCompareBody()); }

  function handleConvert() {
    setLoading(true);
    setError('');
    setResult(null);

    const body = {
      thisQuantity: { type: convertType, value: parseFloat(convertValue), symbol: fromUnit, label: 'From' },
      thatQuantity: { type: convertType, value: 0, symbol: toUnit, label: 'To' },
      targetQuantity: { type: convertType, value: 0, symbol: toUnit, label: 'Target' },
    };

    fetch(`${BASE_URL}/convert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
      .then((res) => {
        if (!res.ok) {
          return res.text().then((text) => {
            let msg = 'Request failed';
            try {
              const json = JSON.parse(text);
              msg = json.message || JSON.stringify(json);
            } catch (_) {
              msg = text || msg;
            }
            throw new Error(msg);
          });
        }
        return res.json();
      })
      .then((data) => {
        setResult(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }

  function handleHistory() {
    setLoading(true);
    setError('');
    setHistoryResults([]);

    fetch(`${BASE_URL}/history/action/${historyAction}`)
      .then((res) => res.json())
      .then((data) => {
        setHistoryResults(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }

  function handleTabChange(tab) {
    setActiveTab(tab);
    setResult(null);
    setError('');
    setValue1('');
    setValue2('');
    setHistoryResults([]);
  }




  function renderArithmeticForm(action, onSubmit) {
    const units = getUnits(type);
    return (
      <div className="qm-form">
        <div className="qm-row">
          <div className="qm-field">
            <label>Measurement Type</label>
            <select value={type} onChange={(e) => handleTypeChange(e.target.value)}>
              <option value="length">Length</option>
              <option value="weight">Weight</option>
              <option value="temperature">Temperature</option>
              <option value="volume">Volume</option>
            </select>
          </div>
          <div className="qm-field">
            <label>Unit</label>
            <select value={unit} onChange={(e) => setUnit(e.target.value)}>
              {units.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </div>

        <div className="qm-row">
          <div className="qm-field">
            <label>Value 1</label>
            <input
              type="number"
              value={value1}
              onChange={(e) => setValue1(e.target.value)}
              placeholder="First value"
            />
          </div>
          <span className="qm-operator">
            {action === 'Add' && '+'}
            {action === 'Subtract' && '−'}
            {action === 'Divide' && '÷'}
          </span>
          <div className="qm-field">
            <label>Value 2</label>
            <input
              type="number"
              value={value2}
              onChange={(e) => setValue2(e.target.value)}
              placeholder="Second value"
            />
          </div>
        </div>

        <button className="qm-btn" onClick={onSubmit} disabled={loading}>
          {loading ? 'Calculating...' : action}
        </button>
      </div>
    );
  }

  function renderCompareForm() {
    const units = getUnits(compareType);
    return (
      <div className="qm-form">
        <div className="qm-field">
          <label>Measurement Type</label>
          <select
            value={compareType}
            onChange={(e) => {
              const t = e.target.value;
              setCompareType(t);
              const u = getUnits(t);
              setCompareUnit1(u[0]);
              setCompareUnit2(u[1] || u[0]);
            }}
          >
            <option value="length">Length</option>
            <option value="weight">Weight</option>
            <option value="temperature">Temperature</option>
            <option value="volume">Volume</option>
          </select>
        </div>

        <div className="qm-row">
          <div className="qm-field">
            <label>Value 1</label>
            <input
              type="number"
              value={value1}
              onChange={(e) => setValue1(e.target.value)}
              placeholder="First value"
            />
          </div>
          <div className="qm-field">
            <label>Unit 1</label>
            <select value={compareUnit1} onChange={(e) => setCompareUnit1(e.target.value)}>
              {units.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </div>

        <div className="qm-compare-vs">vs</div>

        <div className="qm-row">
          <div className="qm-field">
            <label>Value 2</label>
            <input
              type="number"
              value={value2}
              onChange={(e) => setValue2(e.target.value)}
              placeholder="Second value"
            />
          </div>
          <div className="qm-field">
            <label>Unit 2</label>
            <select value={compareUnit2} onChange={(e) => setCompareUnit2(e.target.value)}>
              {units.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </div>

        <button className="qm-btn" onClick={handleCompare} disabled={loading}>
          {loading ? 'Comparing...' : 'Compare'}
        </button>
      </div>
    );
  }

  const convertUnits = getUnits(convertType);

  return (
    <div className="qm-container">
      <header className="qm-header">
        <h1 className="qm-title">Quantity Measurement</h1>
        <p className="qm-subtitle">Perform operations on physical quantities</p>
      </header>

      <div className="qm-tabs">
        {TABS.map((tab) => (
          <button
            key={tab}
            className={`qm-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => handleTabChange(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="qm-content">
        {activeTab === 'Add' && renderArithmeticForm('Add', handleAdd)}
        {activeTab === 'Subtract' && renderArithmeticForm('Subtract', handleSubtract)}
        {activeTab === 'Divide' && renderArithmeticForm('Divide', handleDivide)}
        {activeTab === 'Compare' && renderCompareForm()}

        {activeTab === 'Convert' && (
          <div className="qm-form">
            <div className="qm-field">
              <label>Type</label>
              <select
                value={convertType}
                onChange={(e) => {
                  const t = e.target.value;
                  setConvertType(t);
                  const u = getUnits(t);
                  setFromUnit(u[0]);
                  setToUnit(u[1] || u[0]);
                }}
              >
                <option value="length">Length</option>
                <option value="weight">Weight</option>
                <option value="temperature">Temperature</option>
                <option value="volume">Volume</option>
              </select>
            </div>
            <div className="qm-field">
              <label>Value</label>
              <input
                type="number"
                value={convertValue}
                onChange={(e) => setConvertValue(e.target.value)}
                placeholder="Enter value to convert"
              />
            </div>
            <div className="qm-row">
              <div className="qm-field">
                <label>From</label>
                <select value={fromUnit} onChange={(e) => setFromUnit(e.target.value)}>
                  {convertUnits.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <span className="qm-operator">→</span>
              <div className="qm-field">
                <label>To</label>
                <select value={toUnit} onChange={(e) => setToUnit(e.target.value)}>
                  {convertUnits.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>
            <button className="qm-btn" onClick={handleConvert} disabled={loading}>
              {loading ? 'Converting...' : 'Convert'}
            </button>
          </div>
        )}

        {activeTab === 'History' && (
          <div className="qm-form">
            <div className="qm-field">
              <label>Filter by Action</label>
              <select value={historyAction} onChange={(e) => setHistoryAction(e.target.value)}>
                <option value="ADD">Add</option>
                <option value="SUBTRACT">Subtract</option>
                <option value="DIVIDE">Divide</option>
                <option value="COMPARE">Compare</option>
                <option value="CONVERT">Convert</option>
              </select>
            </div>
            <button className="qm-btn" onClick={handleHistory} disabled={loading}>
              {loading ? 'Loading...' : 'Fetch History'}
            </button>

            {historyResults.length > 0 && (
              <div className="qm-history-table">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Type</th>
                      <th>Action</th>
                      <th>Expression</th>
                      <th>Result</th>
                      <th>Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyResults.map((row) => (
                      <tr key={row.id}>
                        <td>{row.id}</td>
                        <td>{row.type}</td>
                        <td>{row.action}</td>
                        <td>{row.expression}</td>
                        <td>{row.resultString}</td>
                        <td>{new Date(row.timestamp).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {historyResults.length === 0 && !loading && !error && (
              <p className="qm-empty">No records yet. Click Fetch History.</p>
            )}
          </div>
        )}

        {error && <div className="qm-error">{error}</div>}

        {result && activeTab !== 'History' && (
          <div className="qm-result">
            <p className="qm-result-label">Result</p>
            <p className="qm-result-value">{result.resultString}</p>
            <p className="qm-result-expr">{result.expression}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default QuantityMeasurement;

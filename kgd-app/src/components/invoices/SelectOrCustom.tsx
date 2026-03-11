'use client'

import { useState } from 'react'

interface Props {
    name: string
    label: string
    options: string[]
    placeholder?: string
    defaultValue?: string
    required?: boolean
    inputType?: 'text' | 'number'
    step?: string
}

export default function SelectOrCustom({
    name,
    label,
    options,
    placeholder = 'Enter custom value',
    defaultValue,
    required,
    inputType = 'text',
    step,
}: Props) {
    // If current value is not in preset list, treat as custom
    const isCustomDefault = defaultValue !== undefined && !options.includes(defaultValue)
    const [isCustom, setIsCustom] = useState(isCustomDefault)
    const [customVal, setCustomVal] = useState(isCustomDefault ? (defaultValue ?? '') : '')

    function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
        if (e.target.value === '__custom__') {
            setIsCustom(true)
        } else {
            setIsCustom(false)
        }
    }

    return (
        <div className="form-group">
            {label && <label className="form-label">{label}</label>}
            <select
                name={isCustom ? undefined : name}
                className="form-input"
                defaultValue={isCustomDefault ? '__custom__' : (defaultValue ?? '')}
                onChange={handleChange}
                required={required && !isCustom}
            >
                <option value="">— Select —</option>
                {options.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                ))}
                <option value="__custom__">Custom…</option>
            </select>
            {isCustom && (
                <input
                    name={name}
                    type={inputType}
                    step={step}
                    className="form-input"
                    style={{ marginTop: '0.5rem' }}
                    placeholder={placeholder}
                    defaultValue={customVal}
                    onChange={(e) => setCustomVal(e.target.value)}
                    required={required}
                    autoFocus
                />
            )}
        </div>
    )
}

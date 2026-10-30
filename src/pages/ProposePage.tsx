import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHawaStore } from '../store/useHawaStore';
import { api } from '../services/api';
import { MarketCategory, MarketType } from '../types';
import { Plus, Trash2, AlertCircle, ShieldAlert, CheckCircle } from 'lucide-react';

export const ProposePage: React.FC = () => {
  const { currentUser } = useHawaStore();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<MarketCategory>('campus');
  const [type, setType] = useState<MarketType>('binary');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [closingDate, setClosingDate] = useState('');
  const [closingTime, setClosingTime] = useState('18:00');
  const [resolutionSource, setResolutionSource] = useState('');
  const [confirmNotPrivate, setConfirmNotPrivate] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleAddOption = () => {
    if (options.length < 6) {
      setOptions([...options, '']);
    }
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (index: number, val: string) => {
    const updated = [...options];
    updated[index] = val;
    setOptions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!currentUser) {
      setErrorMsg('Please log in first.');
      return;
    }

    if (title.trim().length < 10 || title.trim().length > 120) {
      setErrorMsg('Title must be between 10 and 120 characters.');
      return;
    }

    if (!resolutionSource.trim()) {
      setErrorMsg('Please provide a verifiable resolution source.');
      return;
    }

    if (!confirmNotPrivate) {
      setErrorMsg('You must confirm this market is not about a private individual.');
      return;
    }

    if (!closingDate) {
      setErrorMsg('Please select a closing date.');
      return;
    }

    const fullCloseIso = new Date(`${closingDate}T${closingTime}:00`).toISOString();
    if (new Date(fullCloseIso).getTime() <= Date.now()) {
      setErrorMsg('Closing time must be in the future.');
      return;
    }

    const finalOptions =
      type === 'binary'
        ? ['Yes', 'No']
        : options.map((o) => o.trim()).filter((o) => o.length > 0);

    if (type === 'multiple' && finalOptions.length < 2) {
      setErrorMsg('Please provide at least 2 valid options for multiple choice.');
      return;
    }

    setIsSubmitting(true);

    try {
      await api.submitProposal({
        creatorId: currentUser.id,
        creatorName: currentUser.displayName,
        creatorHostel: currentUser.hostel,
        title: title.trim(),
        description: description.trim(),
        category: category === 'all' ? 'campus' : category,
        type,
        options: finalOptions,
        closingTime: fullCloseIso,
        resolutionSource: resolutionSource.trim(),
      });

      setSuccess(true);
      setTimeout(() => {
        navigate('/profile#proposals');
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit proposal');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-[700px] mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="font-display font-black text-2xl text-black-cherry">
          Propose a Market
        </h1>
        <p className="text-xs sm:text-sm text-black-cherry/70 mt-1">
          Have intel on an upcoming match, fest surprise, or mess rumor? Propose it to the community.
        </p>
      </div>

      {success ? (
        <div className="p-8 bg-linen border border-petrol/40 rounded-card text-center space-y-3">
          <CheckCircle className="w-12 h-12 text-petrol mx-auto" />
          <h2 className="font-display font-bold text-lg text-black-cherry">
            Proposal Submitted!
          </h2>
          <p className="text-xs text-black-cherry/70">
            Your market has been submitted for review. You can track its status under your profile.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5 bg-linen border border-linen-deep rounded-card p-5 sm:p-7 shadow-subtle">
          {/* Question Title */}
          <div>
            <label className="block text-xs font-bold text-black-cherry mb-1.5">
              Market Title (Question) *
            </label>
            <input
              type="text"
              required
              minLength={10}
              maxLength={120}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Will Hostel B make the table tennis finals?"
              className="w-full px-3.5 py-2.5 bg-linen border border-linen-deep rounded-input text-sm text-black-cherry placeholder:text-black-cherry/40 focus:outline-none focus:ring-2 focus:ring-petrol"
            />
            <div className="text-[11px] text-black-cherry/50 mt-1 flex justify-between">
              <span>Must end with a question mark & be clearly resolvable.</span>
              <span>{title.length}/120</span>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-black-cherry mb-1.5">
              Context & Background
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide background context or why this campus event is trending..."
              className="w-full px-3.5 py-2.5 bg-linen border border-linen-deep rounded-input text-xs sm:text-sm text-black-cherry placeholder:text-black-cherry/40 focus:outline-none focus:ring-2 focus:ring-petrol"
            />
          </div>

          {/* Category & Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-black-cherry mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as MarketCategory)}
                className="w-full px-3 py-2.5 bg-linen border border-linen-deep rounded-input text-xs font-semibold text-black-cherry focus:outline-none focus:ring-2 focus:ring-petrol"
              >
                <option value="league">League (Inter-hostel sports)</option>
                <option value="fest">Fest (Cultural, tech, artists)</option>
                <option value="campus">Campus (Mess, library, wifi, random)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-black-cherry mb-1.5">
                Market Type
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setType('binary')}
                  className={`flex-1 py-2 text-xs font-bold rounded-pill border transition-all ${
                    type === 'binary'
                      ? 'bg-petrol text-linen border-petrol'
                      : 'bg-linen-deep/50 text-black-cherry border-linen-deep'
                  }`}
                >
                  Yes / No
                </button>
                <button
                  type="button"
                  onClick={() => setType('multiple')}
                  className={`flex-1 py-2 text-xs font-bold rounded-pill border transition-all ${
                    type === 'multiple'
                      ? 'bg-petrol text-linen border-petrol'
                      : 'bg-linen-deep/50 text-black-cherry border-linen-deep'
                  }`}
                >
                  Multiple Choice
                </button>
              </div>
            </div>
          </div>

          {/* Multiple Choice Options Builder */}
          {type === 'multiple' && (
            <div className="p-4 bg-linen-deep/30 rounded-input border border-linen-deep space-y-2.5">
              <label className="block text-xs font-bold text-black-cherry">
                Custom Options (2 to 6 options)
              </label>
              {options.map((opt, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <span className="text-xs font-display font-bold text-black-cherry/50 w-4">
                    {idx + 1}.
                  </span>
                  <input
                    type="text"
                    required
                    value={opt}
                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                    placeholder={`Option ${idx + 1} label`}
                    className="flex-1 px-3 py-1.5 bg-linen border border-linen-deep rounded-lg text-xs text-black-cherry focus:outline-none focus:ring-1 focus:ring-petrol"
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(idx)}
                      className="p-1 text-black-cherry/50 hover:text-black-cherry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
              {options.length < 6 && (
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="mt-2 text-xs font-bold text-petrol hover:underline inline-flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add another option</span>
                </button>
              )}
            </div>
          )}

          {/* Closing Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-black-cherry mb-1.5">
                Closing Date *
              </label>
              <input
                type="date"
                required
                value={closingDate}
                onChange={(e) => setClosingDate(e.target.value)}
                className="w-full px-3.5 py-2 bg-linen border border-linen-deep rounded-input text-xs font-medium text-black-cherry focus:outline-none focus:ring-2 focus:ring-petrol"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-black-cherry mb-1.5">
                Closing Time (IST) *
              </label>
              <input
                type="time"
                required
                value={closingTime}
                onChange={(e) => setClosingTime(e.target.value)}
                className="w-full px-3.5 py-2 bg-linen border border-linen-deep rounded-input text-xs font-medium text-black-cherry focus:outline-none focus:ring-2 focus:ring-petrol"
              />
            </div>
          </div>

          {/* Resolution Source */}
          <div>
            <label className="block text-xs font-bold text-black-cherry mb-1.5">
              Resolution Source *
            </label>
            <input
              type="text"
              required
              value={resolutionSource}
              onChange={(e) => setResolutionSource(e.target.value)}
              placeholder="e.g. Official sports Instagram page, Mess notice board, Dean announcement email"
              className="w-full px-3.5 py-2.5 bg-linen border border-linen-deep rounded-input text-xs sm:text-sm text-black-cherry placeholder:text-black-cherry/40 focus:outline-none focus:ring-2 focus:ring-petrol"
            />
            <span className="text-[11px] text-black-cherry/50 mt-1 block">
              Where can moderators unambiguously check the outcome?
            </span>
          </div>

          {/* Community Standards Guidance Notice */}
          <div className="p-4 bg-baby-pink/30 border border-baby-pink rounded-card space-y-2 text-xs text-black-cherry">
            <div className="font-bold flex items-center gap-1.5 text-petrol">
              <ShieldAlert className="w-4 h-4 text-petrol" />
              <span>Campus Safety & Community Rules</span>
            </div>
            <p className="text-[11px] leading-relaxed text-black-cherry/80">
              No questions about private individuals' lives, personal health, relationships, or named students' academic grades. Nothing that harasses, humiliates, or targets anyone.
            </p>
            <label className="flex items-start gap-2 pt-1 cursor-pointer">
              <input
                type="checkbox"
                required
                checked={confirmNotPrivate}
                onChange={(e) => setConfirmNotPrivate(e.target.checked)}
                className="mt-0.5 rounded border-linen-deep text-petrol focus:ring-petrol"
              />
              <span className="font-bold text-[11px]">
                I confirm this isn't about a private individual.
              </span>
            </label>
          </div>

          {errorMsg && (
            <div className="p-3 bg-black-cherry/10 border border-black-cherry/20 text-black-cherry rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-black-cherry" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Submit CTA */}
          <button
            type="submit"
            disabled={isSubmitting || !confirmNotPrivate}
            className="w-full py-3.5 px-4 rounded-pill font-display font-black text-sm bg-tangerine text-black-cherry hover:brightness-105 active:scale-95 transition-all shadow-subtle disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Submitting proposal...' : 'Submit proposal'}
          </button>
        </form>
      )}
    </div>
  );
};

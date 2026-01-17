import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Star,
  Phone,
  Mail,
  MapPin,
  Calendar,
  FileText,
  Plus,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardHeader, Button, Badge, Spinner, Modal, Textarea, Select } from '../../components/ui';
import { usePatient } from '../../hooks';
import { patientsApi, type CreateNoteData } from '../../api/patients';
import type { ClinicalNote } from '../../types';
import { sanitizeContent } from '../../utils/sanitize';

export function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { patient, isLoading, error } = usePatient(id!);
  const [notes, setNotes] = useState<ClinicalNote[]>([]);
  const [isLoadingNotes, setIsLoadingNotes] = useState(true);
  const [notesError, setNotesError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [noteContent, setNoteContent] = useState('');
  const [noteVisitType, setNoteVisitType] = useState<'regular' | 'follow-up' | 'emergency'>('regular');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [addNoteError, setAddNoteError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      patientsApi
        .getNotes(id)
        .then((response) => setNotes(response.items))
        .catch((err) => {
          console.error('Failed to load notes:', err);
          setNotesError('Failed to load clinical notes');
        })
        .finally(() => setIsLoadingNotes(false));
    }
  }, [id]);

  const handleDelete = async () => {
    if (!id) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await patientsApi.deletePatient(id);
      navigate('/patients');
    } catch (err) {
      console.error('Failed to delete patient:', err);
      setDeleteError('Failed to delete patient. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddNote = async () => {
    if (!id || !noteContent.trim()) return;
    setIsAddingNote(true);
    setAddNoteError(null);
    try {
      const noteData: CreateNoteData = {
        content: noteContent,
        visit_type: noteVisitType,
      };
      const newNote = await patientsApi.createNote(id, noteData);
      setNotes([newNote, ...notes]);
      setNoteContent('');
      setNoteVisitType('regular');
      setShowNoteModal(false);
    } catch (err) {
      console.error('Failed to add note:', err);
      setAddNoteError('Failed to add note. Please try again.');
    } finally {
      setIsAddingNote(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="h-8 w-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Patient not found</h2>
        <p className="text-gray-500 mb-6">The patient you're looking for doesn't exist.</p>
        <Link to="/patients">
          <Button>Back to Patients</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 w-full max-w-full xl:max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div className="flex items-center gap-4">
          <Link
            to="/patients"
            className="p-3 hover:bg-gray-100 rounded-xl transition-colors border border-transparent hover:border-gray-200"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/20">
              <span className="text-white font-bold text-2xl">
                {patient.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{patient.name}</h1>
                {patient.is_favorite && (
                  <Star className="h-6 w-6 text-amber-500 fill-amber-500" />
                )}
              </div>
              <p className="text-gray-500 font-medium mt-1">ID: {patient.patient_id}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link to={`/patients/${id}/edit`}>
            <Button variant="outline" className="shadow-sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          </Link>
          <Button variant="danger" onClick={() => setShowDeleteModal(true)} className="shadow-sm">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Patient Info Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Quick Info Card */}
          <Card>
            <CardHeader title="Information" className="mb-6" />
            <div className="space-y-5">
              {patient.phone && (
                <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50/50">
                  <Phone className="h-5 w-5 text-primary-500 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Phone</p>
                    <span className="text-gray-900 font-medium">{patient.phone}</span>
                  </div>
                </div>
              )}
              {patient.email && (
                <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50/50">
                  <Mail className="h-5 w-5 text-primary-500 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</p>
                    <span className="text-gray-900 font-medium break-all">{patient.email}</span>
                  </div>
                </div>
              )}
              {(patient.address || patient.location) && (
                <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50/50">
                  <MapPin className="h-5 w-5 text-primary-500 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Location</p>
                    <span className="text-gray-900 font-medium">
                      {patient.address}
                      {patient.address && patient.location && ', '}
                      {patient.location}
                    </span>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50/50">
                <Calendar className="h-5 w-5 text-primary-500 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Registered</p>
                  <span className="text-gray-900 font-medium">
                    {format(new Date(patient.created_at), 'MMM d, yyyy')}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Group" className="mb-4" />
            {patient.group ? (
              <Badge variant="primary" size="md" className="w-full justify-center py-2">
                {patient.group}
              </Badge>
            ) : (
              <div className="text-center py-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <p className="text-gray-500 text-sm">No group assigned</p>
              </div>
            )}
          </Card>

          {patient.initial_complaint && (
            <Card>
              <CardHeader title="Initial Complaint" className="mb-4" />
              <div className="bg-amber-50/50 rounded-xl p-4 border border-amber-100 text-gray-800 leading-relaxed">
                {sanitizeContent(patient.initial_complaint)}
              </div>
            </Card>
          )}

          {patient.initial_diagnosis && (
            <Card>
              <CardHeader title="Initial Diagnosis" className="mb-4" />
              <div className="bg-emerald-50/50 rounded-xl p-4 border border-emerald-100 text-gray-800 leading-relaxed">
                {sanitizeContent(patient.initial_diagnosis)}
              </div>
            </Card>
          )}
        </div>

        {/* Clinical Notes - Main Content */}
        <div className="lg:col-span-2">
          <Card className="h-full min-h-[500px]">
            <CardHeader
              title="Clinical Notes"
              subtitle={`${notes.length} history records`}
              action={
                <Button onClick={() => setShowNoteModal(true)} className="shadow-md shadow-primary-500/20">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Note
                </Button>
              }
            />

            {isLoadingNotes ? (
              <div className="flex items-center justify-center h-48">
                <Spinner />
              </div>
            ) : notesError ? (
              <div className="text-center py-12 bg-red-50/50 rounded-2xl border border-red-100">
                <FileText className="h-12 w-12 text-red-300 mx-auto mb-3" />
                <p className="text-red-600 font-medium">{notesError}</p>
                <button
                  onClick={() => {
                    setNotesError(null);
                    setIsLoadingNotes(true);
                    patientsApi.getNotes(id!)
                      .then((response) => setNotes(response.items))
                      .catch((err) => {
                        console.error('Failed to load notes:', err);
                        setNotesError('Failed to load clinical notes');
                      })
                      .finally(() => setIsLoadingNotes(false));
                  }}
                  className="text-primary-600 hover:text-primary-700 text-sm mt-3 font-medium underline decoration-primary-300 underline-offset-4"
                >
                  Try reloading
                </button>
              </div>
            ) : notes.length === 0 ? (
              <div className="text-center py-16 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <FileText className="h-8 w-8 text-gray-300" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">No clinical notes</h3>
                <p className="text-gray-500 mb-6">Start documenting the patient's history.</p>
                <Button variant="outline" onClick={() => setShowNoteModal(true)}>
                  Add the first note
                </Button>
              </div>
            ) : (
              <div className="space-y-6 relative before:absolute before:left-8 before:top-4 before:bottom-4 before:w-px before:bg-gray-200">
                {notes.map((note) => (
                  <div key={note.id} className="relative pl-20 group">
                    {/* Timeline dot */}
                    <div className="absolute left-[26px] top-6 w-3 h-3 bg-white border-[3px] border-primary-500 rounded-full z-10 group-hover:scale-125 transition-transform shadow-sm"></div>

                    {/* Timestamp */}
                    <div className="absolute left-0 top-5 w-16 text-right">
                      <p className="text-xs font-bold text-gray-900">
                        {format(new Date(note.created_at), 'MMM d')}
                      </p>
                      <p className="text-[10px] text-gray-500">
                        {format(new Date(note.created_at), 'h:mm a')}
                      </p>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md hover:border-primary-200 transition-all duration-300 relative">
                      <div className="flex items-center justify-between mb-3">
                        <Badge
                          variant={
                            note.visit_type === 'emergency'
                              ? 'danger'
                              : note.visit_type === 'follow-up'
                              ? 'warning'
                              : 'default'
                          }
                          className="capitalize px-2.5 py-0.5"
                        >
                          {note.visit_type}
                        </Badge>
                      </div>
                      <p className="text-gray-700 whitespace-pre-wrap leading-relaxed text-[15px]">
                        {sanitizeContent(note.content)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Patient"
      >
        <div className="p-1">
          <div className="flex items-center gap-4 mb-6 p-4 bg-red-50 rounded-xl border border-red-100">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h4 className="font-semibold text-red-900">Warning</h4>
              <p className="text-sm text-red-700 mt-1">This action cannot be undone.</p>
            </div>
          </div>

          <p className="text-gray-600 mb-6 leading-relaxed">
            Are you sure you want to delete <strong>{patient.name}</strong>? This will permanently remove the patient profile and all associated clinical notes from the system.
          </p>

          {deleteError && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 font-medium">
              {deleteError}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} loading={isDeleting}>
              Yes, Delete Patient
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Note Modal */}
      <Modal
        isOpen={showNoteModal}
        onClose={() => setShowNoteModal(false)}
        title="Add Clinical Note"
        size="lg"
      >
        <div className="space-y-6">
          <Select
            label="Visit Type"
            value={noteVisitType}
            onChange={(e) => setNoteVisitType(e.target.value as 'regular' | 'follow-up' | 'emergency')}
            options={[
              { value: 'regular', label: 'Regular Visit' },
              { value: 'follow-up', label: 'Follow-up' },
              { value: 'emergency', label: 'Emergency' },
            ]}
          />
          <Textarea
            label="Note Content"
            placeholder="Enter clinical notes, observations, and treatment details..."
            rows={8}
            className="text-base"
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
          />
          {addNoteError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 font-medium">
              {addNoteError}
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowNoteModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddNote} loading={isAddingNote} disabled={!noteContent.trim()}>
              Save Note
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

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
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="text-center py-12">
        <h2 className="text-lg font-medium text-gray-900 mb-2">Patient not found</h2>
        <p className="text-gray-500 mb-4">The patient you're looking for doesn't exist.</p>
        <Link to="/patients">
          <Button>Back to Patients</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            to="/patients"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-primary-700 font-bold text-lg">
                {patient.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900">{patient.name}</h1>
                {patient.is_favorite && (
                  <Star className="h-5 w-5 text-yellow-500 fill-current" />
                )}
              </div>
              <p className="text-gray-500">{patient.patient_id}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to={`/patients/${id}/edit`}>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
          <Button variant="danger" onClick={() => setShowDeleteModal(true)}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient Info */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader title="Contact Information" />
            <div className="space-y-4">
              {patient.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-900">{patient.phone}</span>
                </div>
              )}
              {patient.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-900">{patient.email}</span>
                </div>
              )}
              {(patient.address || patient.location) && (
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-900">
                    {patient.address}
                    {patient.address && patient.location && ', '}
                    {patient.location}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-gray-400" />
                <span className="text-gray-900">
                  Added {format(new Date(patient.created_at), 'MMM d, yyyy')}
                </span>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Group" />
            {patient.group ? (
              <Badge variant="primary" size="md">
                {patient.group}
              </Badge>
            ) : (
              <p className="text-gray-500">No group assigned</p>
            )}
          </Card>

          {patient.initial_complaint && (
            <Card>
              <CardHeader title="Initial Complaint" />
              <p className="text-gray-900">{patient.initial_complaint}</p>
            </Card>
          )}

          {patient.initial_diagnosis && (
            <Card>
              <CardHeader title="Initial Diagnosis" />
              <p className="text-gray-900">{patient.initial_diagnosis}</p>
            </Card>
          )}
        </div>

        {/* Clinical Notes */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader
              title="Clinical Notes"
              subtitle={`${notes.length} notes`}
              action={
                <Button onClick={() => setShowNoteModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Note
                </Button>
              }
            />

            {isLoadingNotes ? (
              <div className="flex items-center justify-center h-32">
                <Spinner />
              </div>
            ) : notesError ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-red-300 mx-auto mb-3" />
                <p className="text-red-500">{notesError}</p>
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
                  className="text-primary-600 hover:text-primary-700 text-sm mt-2"
                >
                  Try again
                </button>
              </div>
            ) : notes.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No clinical notes yet</p>
                <button
                  onClick={() => setShowNoteModal(true)}
                  className="text-primary-600 hover:text-primary-700 text-sm mt-2"
                >
                  Add the first note
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {notes.map((note) => (
                  <div
                    key={note.id}
                    className="p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Badge
                        variant={
                          note.visit_type === 'emergency'
                            ? 'danger'
                            : note.visit_type === 'follow-up'
                            ? 'warning'
                            : 'default'
                        }
                      >
                        {note.visit_type}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {format(new Date(note.created_at), 'MMM d, yyyy h:mm a')}
                      </span>
                    </div>
                    <p className="text-gray-900 whitespace-pre-wrap">{sanitizeContent(note.content)}</p>
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
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete <strong>{patient.name}</strong>? This action cannot be
          undone and will also delete all associated clinical notes.
        </p>
        {deleteError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            {deleteError}
          </div>
        )}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} isLoading={isDeleting}>
            Delete Patient
          </Button>
        </div>
      </Modal>

      {/* Add Note Modal */}
      <Modal
        isOpen={showNoteModal}
        onClose={() => setShowNoteModal(false)}
        title="Add Clinical Note"
        size="lg"
      >
        <div className="space-y-4">
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
            placeholder="Enter clinical notes..."
            rows={6}
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
          />
          {addNoteError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {addNoteError}
            </div>
          )}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowNoteModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddNote} isLoading={isAddingNote} disabled={!noteContent.trim()}>
              Add Note
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
